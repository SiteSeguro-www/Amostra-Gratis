import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  getDocs,
  where,
  getDoc,
  increment,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { saveToMonio, deleteFromMonio } from '../lib/monio';
import { useAuth } from "../components/FirebaseAuthProvider";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Send,
  PlusSquare,
  Bookmark,
  Edit3,
} from "lucide-react";
import { PremiumName, PremiumAvatar } from "../components/PremiumEffects";
import { syncToLocalBackup } from "../utils/upload";
import { CachedImage, CachedVideo } from "../components/CachedMedia";
import OnlineUsers from "../components/OnlineUsers";

export default function Feed() {
  const { user, profile: userProfile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [isLikeLoading, setIsLikeLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const processingLikesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
        let fsUnsubscribe: any;
        const loadPosts = async () => {
          setLoading(true);
          try {
            // Background load from Minio
            const { loadFromMonio } = await import('../lib/monio');
            loadFromMonio('posts').then(minioPosts => {
               if (minioPosts && Array.isArray(minioPosts)) {
                   setPosts(prev => {
                       const merged = [...prev];
                       minioPosts.forEach(mp => {
                           if (!merged.find(p => p.id === mp.id)) {
                               merged.push(mp);
                           }
                       });
                       return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                   });
                   setLoading(false);
               }
            });

            const q = query(
              collection(db, "posts"),
              orderBy("createdAt", "desc"),
              limit(20),
            );

            fsUnsubscribe = onSnapshot(
              q,
              (snapshot) => {
                const postsData = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                // Update with FS data, prioritizing FS over Minio where IDs match, then merging remaining Minio data
                setPosts(prev => {
                    const minioMap = new Map(prev.map(p => [p.id, p]));
                    const fsMap = new Map(postsData.map(p => [p.id, p]));
                    
                    const mergedIds = new Set([...minioMap.keys(), ...fsMap.keys()]);
                    const merged = Array.from(mergedIds).map(id => fsMap.get(id) || minioMap.get(id));
                    
                    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                });
                setLoading(false);
              },
              (error: any) => {
                if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
                  console.warn("Feed listen suppressed due to quota");
                  // Don't clear posts, let MinIO data persist
                  setLoading(false);
                  return;
                }
                console.error("Error listening to posts:", error);
                setLoading(false);
              },
            );
          } catch(e) {
             setLoading(false);
          }
        };
        loadPosts();

    return () => {
        if (fsUnsubscribe) fsUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch initial likes from Firestore
    const fetchLikes = async () => {
      try {
        const qLikes = query(collection(db, "likes"), where("user_id", "==", user.uid));
        const snapshot = await getDocs(qLikes);
        const fsLikes = snapshot.docs.map(doc => doc.data().post_id);
        setUserLikes(fsLikes);
      } catch (error: any) {
        console.warn("Likes fetch issue:", error.message);
      }
    };
    fetchLikes();

    // Fetch bookmarks once (no realtime needed)
    const fetchBookmarks = async () => {
      try {
        const qBookmarks = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(qBookmarks);
        setUserBookmarks(snapshot.docs.map((doc) => doc.data().postId));
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    };
    fetchBookmarks();
  }, [user]);

  useEffect(() => {
    if (!activeCommentPostId) return;

    // Listen to comments (Primary Firestore Realtime)
    const qComments = query(
      collection(db, "comments"), 
      where("post_id", "==", activeCommentPostId),
      orderBy("created_at", "asc")
    );

    const unsubscribe = onSnapshot(qComments, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(prev => ({ ...prev, [activeCommentPostId]: msgs }));
    }, (error) => {
      console.warn("Firestore comments listen failed:", error);
    });

    return () => unsubscribe();
  }, [activeCommentPostId]);

  const toggleComments = (postId: string) => {
    setActiveCommentPostId((prev) => (prev === postId ? null : postId));
  };

  const createNotification = async (
    recipientId: string,
    type: "like" | "comment" | "follow",
    relatedId: string,
    message: string,
  ) => {
    if (!user || user.uid === recipientId) return;
    try {
      const notificationObj = {
        recipient_id: recipientId,
        sender_id: user.uid,
        sender_name: userProfile?.displayName || user.displayName || "Alguém",
        sender_photo: userProfile?.photoURL || user.photoURL || "",
        type,
        related_id: relatedId,
        message,
        read: false,
        created_at: new Date().toISOString(),
      };

      try {
        await addDoc(collection(db, "notifications"), notificationObj);
        saveToMonio('notifications', notificationObj);
      } catch (fsErr) {
        console.error("Firestore notification failed:", fsErr);
      }
    } catch (error) {
      console.error("Error in generic notification process:", error);
    }
  };

  const [doubleTapAnimationId, setDoubleTapAnimationId] = useState<string | null>(null);

  const handleDoubleTap = (postId: string, authorId: string, currentLikes: number) => {
    if (!user) return;
    setDoubleTapAnimationId(postId);
    setTimeout(() => setDoubleTapAnimationId(null), 1000);
    handleLike(postId, currentLikes, authorId, true);
  };

  const handleLike = async (
    postId: string,
    currentLikes: number,
    authorId: string,
    forceLike = false
  ) => {
    if (!user) return alert("Faça login para curtir.");
    
    const isLiked = userLikes.includes(postId);
    if (forceLike && isLiked) return; // Already liked, just the visual animation triggered above

    if (processingLikesRef.current.has(postId)) return;
    
    processingLikesRef.current.add(postId);
    setIsLikeLoading((prev) => ({ ...prev, [postId]: true }));

    try {
      const postRef = doc(db, "posts", postId);

      if (isLiked && !forceLike) {
        // Unlike - Firestore unlike using deterministic ID
        const likeId = `${postId}_${user.uid}`;
        try {
          await deleteDoc(doc(db, "likes", likeId));
          deleteFromMonio('likes', likeId);
        } catch (e) {
          // Fallback delete if old likes exist without deterministic ID
          const qL = query(collection(db, "likes"), where("post_id", "==", postId), where("user_id", "==", user.uid));
          const fsL = await getDocs(qL);
          fsL.forEach(d => {
            deleteDoc(d.ref);
            deleteFromMonio('likes', d.id);
          });
        }

        await updateDoc(postRef, {
          likesCount: increment(-1),
        });
        
        // Sync to Local Backup
        await syncToLocalBackup('unlike', { postId, userId: user.uid });

        // Ensure count never goes below 0 (Post-increment check or manual correction)
        const finalSnap = await getDoc(postRef);
        if (finalSnap.exists() && (finalSnap.data().likesCount || 0) < 0) {
          await updateDoc(postRef, { likesCount: 0 });
        }

        setUserLikes((prev) => prev.filter((id) => id !== postId));
      } else {
        // Like - Write to Firestore
        const now = new Date().toISOString();
        const likeId = `${postId}_${user.uid}`;

        try {
          const { setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "likes", likeId), {
            post_id: postId,
            user_id: user.uid,
            created_at: now
          });
          
          await updateDoc(postRef, { likesCount: increment(1) });
          // Sync to Local Backup
          await syncToLocalBackup('like', { id: likeId, post_id: postId, user_id: user.uid, created_at: now });
          // Sync to MinIO
          saveToMonio('likes', { id: likeId, post_id: postId, user_id: user.uid, created_at: now });
          
          createNotification(authorId, "like", postId, "curtiu seu post");
          setUserLikes((prev) => [...prev, postId]);
        } catch(e) { console.error("Firestore like failed:", e); }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Erro ao processar curtida.");
    } finally {
      processingLikesRef.current.delete(postId);
      setIsLikeLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user) return alert("Faça login para salvar.");

    const isBookmarked = userBookmarks.includes(postId);

    try {
      if (isBookmarked) {
        const q = query(
          collection(db, "bookmarks"),
          where("postId", "==", postId),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
          await deleteDoc(doc(db, "bookmarks", d.id));
          deleteFromMonio('bookmarks', d.id);
        });
      } else {
        const bookmarkData = {
          postId,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, "bookmarks"), bookmarkData);
        saveToMonio('bookmarks', { id: docRef.id, ...bookmarkData });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Erro ao salvar o post.");
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!user || !commentText.trim() || isCommentLoading) return;

    setIsCommentLoading(true);
    let text = commentText;
    if (
      userProfile &&
      userProfile.badges &&
      userProfile.badges.includes("extra_premium_comment")
    ) {
      text = `[PREMIUM_COMMENT]${commentText}`;
    }
    setCommentText("");

    try {
      const now = new Date().toISOString();
      const commentObj = {
        post_id: postId,
        author_id: user.uid,
        author_name: userProfile?.displayName || user.displayName || "Usuário",
        author_photo: userProfile?.photoURL || user.photoURL || "",
        text,
        created_at: now,
      };

      const docRef = await addDoc(collection(db, "comments"), commentObj);
      saveToMonio('comments', { id: docRef.id, ...commentObj });

      // Update comments count in Firestore
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, { commentsCount: increment(1) });
        createNotification(
          postData.authorId,
          "comment",
          postId,
          "comentou no seu post",
        );
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Erro ao enviar comentário. Tente novamente.");
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este post?")) return;
    try {
      const postSnap = await getDoc(doc(db, "posts", postId));
      if (postSnap.exists() && postSnap.data()?.mediaUrl) {
         const url = postSnap.data().mediaUrl;
         const fileKeyArray = url.split(process.env.MINIO_BUCKET || 'packzinhu-db');
         if (fileKeyArray.length > 1) {
            let fileKey = fileKeyArray[1].substring(1); // removes the leading slash
            const { deleteMedia } = await import('../utils/upload');
            deleteMedia(fileKey);
         }
      }

      await deleteDoc(doc(db, "posts", postId));
      deleteFromMonio('posts', postId);
      // Dual-delete from MinIO
      deleteFromMonio('posts', postId);
      alert("Post deletado com sucesso!");
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!window.confirm("Deletar comentário?")) return;
    try {
      await deleteDoc(doc(db, "comments", commentId));
      // Dual-delete from MinIO
      deleteFromMonio('comments', commentId);

      // Update comments count
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCommentsCount = postSnap.data()?.commentsCount || 0;
        const updateData = {
          commentsCount: Math.max(0, currentCommentsCount - 1),
        };
        await updateDoc(postRef, updateData);
        // Sync post update to Monio
        saveToMonio('posts', { id: postId, ...postSnap.data(), ...updateData });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Erro ao deletar comentário.");
    }
  };

  const handleSavePostEdit = async (postId: string) => {
    if (!editingPostId || !editingPostContent.trim()) return;
    try {
      const updateData = {
        content: editingPostContent,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, "posts", postId), updateData);
      
      const postSnap = await getDoc(doc(db, "posts", postId));
      if (postSnap.exists()) {
        saveToMonio('posts', { id: postId, ...postSnap.data() });
      }

      setEditingPostId(null);
      setEditingPostContent("");
    } catch (error) {
      console.error("Error editing post:", error);
      alert("Erro ao editar post.");
    }
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    try {
      const updateData = { 
        text: editingCommentText,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, "comments", commentId), updateData);
      
      const commentSnap = await getDoc(doc(db, "comments", commentId));
      if (commentSnap.exists()) {
        saveToMonio('comments', { id: commentId, ...commentSnap.data() });
      }

      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      console.error("Error editing comment:", error);
      alert("Erro ao editar comentário");
    }
  };

  return (
    <>
      <Helmet>
        <title>PackZinhu - Feed Global de Conteúdos</title>
        <meta name="description" content="Acompanhe as últimas atualizações, fotos e novidades dos seus criadores favoritos no Feed Global do PackZinhu." />
        <link rel="canonical" href="https://packzinhu.online/feed" />
      </Helmet>
      <div className="max-w-4xl mx-auto py-4 md:py-8 px-2 md:px-4 flex gap-6 items-start">
        <div className="flex-1 w-full min-w-0">
          {/* Online Users Mobile (Somente celular) */}
          <div className="lg:hidden mb-4 overflow-hidden">
            <OnlineUsers />
          </div>

          <div className="flex items-center justify-between mb-6 md:mb-8 px-2 md:px-0">
            <h1 className="text-2xl md:text-3xl font-black text-white">Feed Global</h1>
            {user && (
              <Link
                to="/create-post"
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full font-bold flex items-center gap-2 transition-colors"
              >
                <PlusSquare className="w-5 h-5" /> Criar Post
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-zinc-900 rounded-2xl border border-white/5">
              Nenhum post encontrado. Seja o primeiro a postar!
            </div>
          ) : (
            <div className="space-y-6">
              {(posts || []).map((post) => {
                const isLiked = userLikes.includes(post?.id);
                const isOwner = user?.uid === post?.authorId;

                return (
                  <div
                    key={post?.id}
                    className="w-full bg-[#1C1E32] border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-purple-500/30 transition-all duration-300"
                  >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${post?.authorId}`}>
                        <PremiumAvatar
                          borderStyle={post?.authorBorderStyle}
                          className="w-10 h-10 border border-white/10"
                        >
                          <img
                            src={
                              post?.authorPhoto ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${post?.authorId}`
                            }
                            alt="Author"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </PremiumAvatar>
                      </Link>
                      <div>
                        <div className="flex items-center gap-1">
                          <Link to={`/profile/${post?.authorId}`}>
                            <PremiumName
                              fontStyle={post?.authorFontStyle}
                              badges={post?.authorBadges}
                              isVerified={post?.authorVerified}
                              isAdmin={
                                post?.authorRole === "admin" ||
                                post?.authorEmail === "dweminem@gmail.com" ||
                                post?.authorEmail ===
                                  "contato.packzinhu@gmail.com"
                              }
                              className="text-sm"
                            >
                              {post?.authorName}
                            </PremiumName>
                          </Link>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {post?.createdAt
                            ? new Date(post.createdAt).toLocaleString()
                            : "Recentemente"}
                        </p>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditingPostContent(post.content || "");
                          }}
                          className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-full hover:bg-white/5"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-white/5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingPostId === post.id ? (
                    <div className="px-4 pb-3">
                      <textarea
                        value={editingPostContent}
                        onChange={(e) => setEditingPostContent(e.target.value)}
                        className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors min-h-[100px] resize-none"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSavePostEdit(post.id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : post?.content ? (
                    <div className="px-4 pb-3 text-gray-300 whitespace-pre-wrap">
                      {post.content}
                    </div>
                  ) : null}

                  {post?.mediaUrl && (
                    <div 
                      className="w-full max-h-[500px] bg-black flex items-center justify-center overflow-hidden relative"
                      onDoubleClick={() => handleDoubleTap(post.id, post.authorId, post.likesCount || 0)}
                    >
                      {post?.mediaType === "video" ? (
                        <CachedVideo
                          src={post.mediaUrl}
                          controls
                          className="max-w-full max-h-[500px] object-contain"
                        />
                      ) : (
                        <CachedImage
                          src={post.mediaUrl}
                          alt="Post media"
                          className="max-w-full max-h-[600px] md:max-h-[500px] object-contain cursor-pointer"
                          loading="lazy"
                        />
                      )}
                      
                      {/* Heart Animation Overlay */}
                      {doubleTapAnimationId === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl animate-ping opacity-80" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 border-t border-white/5 flex items-center gap-6">
                    <button
                      onClick={() =>
                        handleLike(post.id, post.likesCount || 0, post.authorId)
                      }
                      disabled={isLikeLoading[post.id]}
                      className={`flex items-center gap-2 transition-all disabled:opacity-50 ${isLiked ? "text-pink-500" : "text-gray-400 hover:text-pink-500"}`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isLiked ? "fill-pink-500" : ""}`}
                      />
                      <span className="text-sm">{post?.likesCount || 0}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-2 transition-all ${activeCommentPostId === post.id ? "text-purple-400" : "text-gray-400 hover:text-purple-400"}`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">
                        {post?.commentsCount || 0} Comentários
                      </span>
                    </button>
                    <button
                      onClick={() => handleBookmark(post.id)}
                      className={`flex items-center gap-2 transition-all ${userBookmarks.includes(post.id) ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"}`}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${userBookmarks.includes(post.id) ? "fill-yellow-500" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/feed?post=${post.id}`;
                        if (navigator.share) {
                          navigator
                            .share({
                              title: "Post no PackZinhu",
                              text: `Confira este post de ${post.authorName}`,
                              url: url,
                            })
                            .catch(console.error);
                        } else {
                          navigator.clipboard.writeText(url);
                          alert("Link copiado para a área de transferência!");
                        }
                      }}
                      className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-all ml-auto"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Comments Section */}
                  {activeCommentPostId === post?.id && (
                    <div className="bg-black p-4 border-t border-white/5">
                      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                        {comments[post.id]?.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center">
                            Nenhum comentário ainda.
                          </p>
                        ) : (
                          (comments[post.id] || []).map((comment) => {
                            const isPremium =
                              comment?.is_premium ||
                              comment?.text?.startsWith("[PREMIUM_COMMENT]");
                            const commentText =
                              isPremium &&
                              comment?.text?.startsWith("[PREMIUM_COMMENT]")
                                ? comment.text.replace("[PREMIUM_COMMENT]", "")
                                : comment?.text;

                            return (
                              <div key={comment?.id} className="flex gap-3">
                                <img
                                  src={
                                    comment?.author_photo ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment?.author_id}`
                                  }
                                  alt="Author"
                                  className="w-8 h-8 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div
                                  className={`flex-1 rounded-2xl rounded-tl-none p-3 relative group border ${
                                    isPremium
                                      ? "bg-gradient-to-br from-purple-600/20 via-zinc-800 to-pink-600/20 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] overflow-hidden"
                                      : "bg-zinc-800 border-white/5"
                                  }`}
                                >
                                  {isPremium && (
                                    <div className="glass-shine-effect" />
                                  )}
                                  <p
                                    className={`font-bold text-sm mb-1 ${isPremium ? "text-purple-300" : ""}`}
                                  >
                                    {comment?.author_name}
                                  </p>
                                  {editingCommentId === comment.id ? (
                                    <div className="mt-2">
                                      <input
                                        type="text"
                                        value={editingCommentText}
                                        onChange={(e) =>
                                          setEditingCommentText(e.target.value)
                                        }
                                        className="w-full bg-[#131524] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors text-sm"
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2 mt-2">
                                        <button
                                          onClick={() =>
                                            setEditingCommentId(null)
                                          }
                                          className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleSaveCommentEdit(comment.id)
                                          }
                                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                                        >
                                          Salvar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-300">
                                      {commentText}
                                    </p>
                                  )}
                                  {user?.uid === comment?.author_id &&
                                    editingCommentId !== comment.id && (
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-2 z-30 bg-zinc-800/80 rounded-full px-1 py-0.5">
                                        <button
                                          onClick={() => {
                                            setEditingCommentId(comment.id);
                                            setEditingCommentText(
                                              commentText || "",
                                            );
                                          }}
                                          className="text-gray-500 hover:text-blue-500 transition-all p-1"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(
                                              comment.id,
                                              post.id,
                                            )
                                          }
                                          className="text-gray-500 hover:text-red-500 transition-all p-1"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      {user ? (
                        <form
                          onSubmit={(e) => handleAddComment(e, post.id)}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={
                              isCommentLoading
                                ? "Enviando..."
                                : "Adicione um comentário..."
                            }
                            disabled={isCommentLoading}
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-purple-500 transition-colors text-white disabled:opacity-50"
                          />
                          <button
                            type="submit"
                            disabled={!commentText.trim() || isCommentLoading}
                            className="p-2 bg-purple-600 rounded-full text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <p className="text-sm text-gray-500 text-center">
                          Faça login para comentar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden lg:block w-72 sticky top-24">
        <OnlineUsers />
      </div>
    </div>
    </>
  );
}
