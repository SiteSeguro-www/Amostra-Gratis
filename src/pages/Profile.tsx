import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  increment,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { uploadToStorage, syncToLocalBackup } from "../utils/upload";
import { CachedImage } from "../components/CachedMedia";
import { useAuth } from "../components/FirebaseAuthProvider";
import {
  Star,
  Package,
  MessageCircle,
  Edit3,
  X,
  Users,
  Trash2,
  Heart,
  Share2,
  Send,
  Bookmark,
  ShieldCheck,
  ShoppingCart,
  Bell,
  Volume2,
  VolumeX,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import JsonLd from "../components/JsonLd";
import { saveToMonio, deleteFromMonio } from '../lib/monio';
import { useNotificationSound } from "../components/NotificationSoundProvider";
import { compressImage } from "../utils/imageCompression";
import {
  PremiumName,
  PremiumAvatar,
  PremiumBackground,
} from "../components/PremiumEffects";
import SecretContentSection from "../components/SecretContentSection";

import { API_URL, getApiUrl } from "../config";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "true" && user?.uid === id) {
      setIsEditing(true);
    }
  }, [location.search, user, id]);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [editCover, setEditCover] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);

  // Feed State
  const [userPosts, setUserPosts] = useState<any[]>([]);
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
  const [activeTab, setActiveTab] = useState<"services" | "feed" | "reviews" | "secret">(
    "feed",
  );
  const [reviews, setReviews] = useState<any[]>([]);
  const [salesCount, setSalesCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchStats = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("seller_id", "==", id),
          where("status", "in", [
            "paid",
            "accepted",
            "completed_by_seller",
            "delivered",
          ]),
        );
        const snapshot = await getDocs(q);
        setSalesCount(snapshot.size);

        const uniqueClients = new Set();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.buyerId) uniqueClients.add(data.buyerId);
        });
        setClientsCount(uniqueClients.size);
      } catch (error) {
        console.error("Error fetching profile stats:", error);
      }
    };

    fetchStats();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    
    // Background load from Minio
    import('../lib/monio').then(({ loadSingleFromMonio, loadFromMonio }) => {
      loadSingleFromMonio('users', id).then(minioProfile => {
        if (minioProfile) {
          setProfile(prev => prev || minioProfile);
          setLoading(false);
        }
      });

      loadFromMonio('services').then(minioServices => {
        if (minioServices && Array.isArray(minioServices)) {
          const userServices = minioServices.filter(s => s.sellerId === id);
          if (userServices.length > 0) {
            setServices(prev => {
               if (prev.length > 0) return prev; // If already loaded from FS
               return userServices;
            });
          }
        }
      });
    });

    const unsubProfile = onSnapshot(doc(db, "users", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({ id: docSnap.id, ...data });
        setEditName(data.displayName || "");
        setEditBio(data.bio || "");
        setEditPhoto(data.photoURL || "");
        setEditCover(data.coverURL || "");
        setEditWebsite(data.website || "");
        setEditLocation(data.location || "");
        setLoading(false);
      } else {
        // If the profile doesn't exist but it belongs to the currently logged in user, create it
        if (user && user.uid === id) {
          const createProfile = async () => {
            try {
              const newProfile = {
                uid: user.uid,
                displayName: user.displayName || user.email?.split("@")[0] || "Usuário",
                email: user.email,
                username: user.email?.split("@")[0] || user.uid,
                photoURL: user.photoURL || "",
                createdAt: new Date().toISOString(),
              };
              // Usa merge: true para não apagar hotcoins, compras e seguidores caso o doc exista mas o Firebase disparou exists: false por conta do cache/offline
              await setDoc(doc(db, "users", id), newProfile, { merge: true });
              saveToMonio('users', { id, ...newProfile });
              // The snapshot listener will trigger again with the new data
            } catch (error) {
              console.error("Error creating missing profile:", error);
              setLoading(false);
            }
          };
          createProfile();
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    let timeoutId: NodeJS.Timeout;
    const fetchServices = async () => {
      if (document.visibilityState !== "visible") {
        timeoutId = setTimeout(fetchServices, 60000);
        return;
      }
      try {
        const q = query(
          collection(db, "services"),
          where("sellerId", "==", id),
        );
        const snapshot = await getDocs(q);
        setServices(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching services:", error);
      }
      timeoutId = setTimeout(fetchServices, 120000); // 2 minutes
    };
    fetchServices();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timeoutId);
        fetchServices();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubProfile();
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;

    // Fetch initial follow status - primary Firestore, fallback Supabase
    const fetchFollowStatus = async () => {
      try {
        const qF = query(collection(db, "follows"), where("follower_id", "==", user.uid), where("following_id", "==", id));
        const snapshot = await getDocs(qF);
        if (!snapshot.empty) {
          setIsFollowing(true);
          setFollowId(snapshot.docs[0].id);
        } else {
          setIsFollowing(false);
          setFollowId(null);
        }
      } catch (err) {
        console.warn("Follow fetch issue:", err);
      }
    };
    fetchFollowStatus();
  }, [user, id]);

  // Feed Effects
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "posts"),
      where("authorId", "==", id),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserPosts(postsData);
      },
      (error) => {
        console.error("Error listening to user posts:", error);
      },
    );

    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("sellerId", "==", id),
          orderBy("createdAt", "desc"),
        );
        const snapshot = await getDocs(q);
        const fetchedReviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setReviews(fetchedReviews);
        
        // Auto-fix for lost ratings due to cache overrides
        if (fetchedReviews.length > 0 && id === user?.uid) {
          const totalRatingSum = fetchedReviews.reduce((sum, rev: any) => sum + (Number(rev.rating) || 0), 0);
          const expectedRating = totalRatingSum / fetchedReviews.length;
          
          if (!profile.rating || profile.reviewsCount !== fetchedReviews.length) {
            await updateDoc(doc(db, "users", id), {
              rating: expectedRating,
              reviewsCount: fetchedReviews.length,
              totalRating: totalRatingSum
            });
          }
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };
    fetchReviews();

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!user) return;

    const fetchLikes = async () => {
      if (!user) return;
      try {
        const qL = query(collection(db, "likes"), where("user_id", "==", user.uid));
        const snapshot = await getDocs(qL);
        setUserLikes(snapshot.docs.map(doc => doc.data().post_id));
      } catch (error: any) {
        console.error("Firestore likes fetch failed:", error);
      }
    };
    fetchLikes();

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

    let fsUnsubscribe: any = null;

    const fetchComments = async () => {
      try {
        const qC = query(
          collection(db, "comments"), 
          where("post_id", "==", activeCommentPostId),
          orderBy("created_at", "asc")
        );
        fsUnsubscribe = onSnapshot(qC, (snapshot) => {
          const fsC = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setComments((prev) => ({
            ...prev,
            [activeCommentPostId]: fsC,
          }));
        });
      } catch (error: any) {
        console.error("Firestore comments fetch failed:", error);
      }
    };
    fetchComments();

    return () => {
      if (fsUnsubscribe) fsUnsubscribe();
    };
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
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const notificationObj = {
        recipient_id: recipientId,
        sender_id: user.uid,
        sender_name: userData.displayName || user.displayName || "Alguém",
        sender_photo: userData.photoURL || user.photoURL || "",
        type,
        related_id: relatedId,
        message,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Backup: Firestore
      try {
        await addDoc(collection(db, "notifications"), notificationObj);
        saveToMonio('notifications', notificationObj);
      } catch (fsErr) {
        console.error("Firestore fallback notification failed:", fsErr);
      }
    } catch (error) {
      console.error("Error creating notification process:", error);
    }
  };

  const handleLike = async (
    postId: string,
    currentLikes: number,
    authorId: string,
  ) => {
    if (!user) return alert("Faça login para curtir.");
    if (isLikeLoading[postId]) return;

    setIsLikeLoading((prev) => ({ ...prev, [postId]: true }));

    try {
      const postRef = doc(db, "posts", postId);
      const isLiked = userLikes.includes(postId);

      if (isLiked) {
        // FS Backup unlike using deterministic ID
        const likeId = `${postId}_${user.uid}`;
        try {
          await deleteDoc(doc(db, "likes", likeId));
        } catch (e) {
          // Fallback delete for old data
          const qL = query(collection(db, "likes"), where("post_id", "==", postId), where("user_id", "==", user.uid));
          const fsL = await getDocs(qL);
          fsL.forEach(d => deleteDoc(d.ref));
        }

        await updateDoc(postRef, {
          likesCount: increment(-1),
        });
        
        // Sync to Local Backup
        await syncToLocalBackup('unlike', { postId, userId: user.uid });

        // Ensure count never goes below 0
        const finalSnap = await getDoc(postRef);
        if (finalSnap.exists() && (finalSnap.data().likesCount || 0) < 0) {
          await updateDoc(postRef, { likesCount: 0 });
        }

        setUserLikes((prev) => prev.filter((id) => id !== postId));
      } else {
        // Like
        let success = false;
        const now = new Date().toISOString();
        const likeId = `${postId}_${user.uid}`;

        // Firestore Deterministic Write
        try {
          await setDoc(doc(db, "likes", likeId), {
            post_id: postId,
            user_id: user.uid,
            created_at: now
          });
          success = true;
        } catch(e) { console.error("Firestore like backup failed too"); }

        if (success) {
          await updateDoc(postRef, { likesCount: increment(1) });
          // Sync to Local Backup
          await syncToLocalBackup('like', { id: likeId, post_id: postId, user_id: user.uid, created_at: now });
          
          createNotification(authorId, "like", postId, "curtiu seu post");
          setUserLikes((prev) => [...prev, postId]);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Erro ao processar curtida.");
    } finally {
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

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      let text = commentText;
      if (
        userData &&
        userData.badges &&
        userData.badges.includes("extra_premium_comment")
      ) {
        text = `[PREMIUM_COMMENT]${commentText}`;
      }
      setCommentText("");

      let success = false;
      const commentObj = {
        post_id: postId,
        author_id: user.uid,
        author_name: userData.displayName || user.displayName || "Usuário",
        author_photo: userData.photoURL || user.photoURL || "",
        text,
        created_at: new Date().toISOString(),
      };

      try {
        const docRefComment = await addDoc(collection(db, "comments"), commentObj);
        saveToMonio('comments', { id: docRefComment.id, ...commentObj });
        success = true;
      } catch(err) { console.error(err) }

      if (success) {
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          await updateDoc(postRef, { commentsCount: increment(1) });
          
          // Sync to Local Backup
          await syncToLocalBackup('comment', { post_id: postId, ...commentObj });

          createNotification(
            postData.authorId,
            "comment",
            postId,
            "comentou no seu post",
          );
        }
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
            let fileKey = fileKeyArray[1].substring(1); 
            const { deleteMedia } = await import('../utils/upload');
            deleteMedia(fileKey);
         }
      }

      await deleteDoc(doc(db, "posts", postId));
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

  const handleFollow = async () => {
    if (!user || !id || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      // Check current status using Firestore
      const qF = query(collection(db, "follows"), where("follower_id", "==", user.uid), where("following_id", "==", id));
      const fsF = await getDocs(qF);
      const currentlyFollowing = !fsF.empty;

      // Fetch current counts to prevent negatives
      const userRef = doc(db, "users", id);
      const currentUserRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const currentUserSnap = await getDoc(currentUserRef);

      const currentFollowers = userSnap.data()?.followersCount || 0;
      const currentFollowingCount = currentUserSnap.data()?.followingCount || 0;

      if (currentlyFollowing) {
        // Unfollow: delete from Firestore
        fsF.forEach(d => deleteDoc(d.ref));

        await updateDoc(userRef, {
          followersCount: Math.max(0, currentFollowers - 1),
        });
        await updateDoc(currentUserRef, {
          followingCount: Math.max(0, currentFollowingCount - 1),
        });

        // Sync to Local Backup
        await syncToLocalBackup('unfollow', { followerId: user.uid, followingId: id });

        setIsFollowing(false);
        setFollowId(null);
      } else {
        // Follow in Firestore
        let success = false;
        let newFollowId = '';
        
        try {
          const followObj = {
            follower_id: user.uid,
            following_id: id,
            created_at: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, "follows"), followObj);
          saveToMonio('follows', { id: docRef.id, ...followObj });
          success = true;
          newFollowId = docRef.id;
        } catch (err) { console.error(err) }

        if (success) {
          await updateDoc(userRef, { followersCount: currentFollowers + 1 });
          await updateDoc(currentUserRef, {
            followingCount: currentFollowingCount + 1,
          });

          // Sync to Local Backup
          await syncToLocalBackup('follow', { id: newFollowId, followerId: user.uid, followingId: id });

          createNotification(id, "follow", user.uid, "começou a te seguir");
          setIsFollowing(true);
          setFollowId(newFollowId);

          // Email Notification for New Follower
          try {
            const idToken = await user.getIdToken();
            fetch(getApiUrl("/api/notify-follow"), {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
              },
              body: JSON.stringify({ followerId: user.uid, followedId: id }),
            });
          } catch (e) {
            console.error("Failed to send follow email notify:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleFileUpload = async (file: File, path: string, onProgress?: (p: number) => void) => {
    if (!user) return null;

    try {
      return await uploadToStorage(file, path, onProgress);
    } catch (error: any) {
      console.error("Upload error via proxy:", error);
      throw new Error(`Upload falhou: ${error.message}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !id || user.uid !== id) return;
    if (!editName.trim()) return alert("O nome não pode estar vazio.");

    setUploading(true);
    try {
      console.log("Salvando perfil para:", id);
      const updateData: any = {
        displayName: editName,
        bio: editBio,
        photoURL: editPhoto,
        coverURL: editCover,
        website: editWebsite,
        location: editLocation,
      };

      // Only set immutable fields if the profile doesn't exist yet
      if (!profile) {
        updateData.uid = user.uid;
        updateData.username = user.email?.split("@")[0] || user.uid;
        updateData.createdAt = new Date().toISOString();
      }

      await setDoc(doc(db, "users", id), updateData, { merge: true });
      
      // Dual-write to MinIO
      saveToMonio('users', { id, ...updateData });
      
      // Sync to Local Backup
      await syncToLocalBackup('profile', { id, ...updateData });

      setProfile((prev: any) => ({
        ...prev,
        ...updateData,
      }));
      setIsEditing(false);
      alert("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert(
        `Erro ao atualizar perfil: ${error.message || "Erro desconhecido"}`,
      );
    } finally {
      setUploading(false);
    }
  };

  const {
    soundEnabled,
    setSoundEnabled,
    browserNotificationsEnabled,
    setBrowserNotificationsEnabled,
    playSound,
  } = useNotificationSound();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = (service: any) => {
    if (!user) {
      navigate("/login?redirect=/profile/" + id);
      return;
    }
    if (!service) return;

    if (user.uid === service.sellerId) {
      alert("Você não pode comprar seu próprio serviço.");
      return;
    }

    navigate(`/checkout/${service.id}`);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este serviço?")) return;
    try {
      await deleteDoc(doc(db, "services", serviceId));
      alert("Serviço deletado com sucesso!");
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Erro ao deletar serviço.");
    }
  };

  const handleSavePostEdit = async (postId: string) => {
    if (!editingPostContent.trim()) return;
    try {
      await updateDoc(doc(db, "posts", postId), {
        content: editingPostContent,
      });
      setEditingPostId(null);
      setEditingPostContent("");
    } catch (error) {
      console.error("Error editing post:", error);
      alert("Erro ao editar post");
    }
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      await updateDoc(doc(db, "comments", commentId), {
        text: editingCommentText,
      });
      setEditingCommentId(null);
      setEditingCommentText("");
      
      // Update local state for immediate feedback
      if (activeCommentPostId) {
        setComments((prev) => {
          const postComments = prev[activeCommentPostId] || [];
          return {
            ...prev,
            [activeCommentPostId]: postComments.map((c) =>
              c.id === commentId ? { ...c, text: editingCommentText } : c,
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      alert("Erro ao editar comentário");
    }
  };

  if (loading)
    return <div className="py-20 text-center">Carregando perfil...</div>;
  if (!profile)
    return <div className="py-20 text-center">Perfil não encontrado.</div>;

  const isOwner = user?.uid === id;

  return (
    <PremiumBackground
      backgroundStyle={profile?.backgroundStyle}
      className="w-full min-h-screen"
    >
      <JsonLd 
        type="Person"
        data={{
          name: profile?.displayName || "Usuário PackZinhu",
          description: profile?.bio || "Criador de conteúdo no PackZinhu",
          image: profile?.photoURL,
          url: `https://packzinhu.online/profile/${id}`,
          sameAs: profile?.website ? [profile.website] : []
        }}
      />
      <Helmet>
        <title>{profile?.displayName || "Perfil"} | PackZinhu - Venda de Fotos de Pés</title>
        <meta name="description" content={profile?.bio || `Confira o perfil de ${profile?.displayName || 'este criador'} no PackZinhu. Acompanhe posts, packs e conteúdos exclusivos.`} />
        <meta name="keywords" content={`${profile?.displayName || 'perfil'}, vender fotos de pés, PackZinhu, criador de conteúdo, packs online`} />
        <link rel="canonical" href={`https://packzinhu.online/profile/${id}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${profile?.displayName || 'Perfil'} | PackZinhu`} />
        <meta property="og:description" content={profile?.bio || "Confira meu conteúdo exclusivo no PackZinhu."} />
        <meta property="og:image" content={profile?.photoURL || "https://packzinhu.online/banner-principal.jpeg"} />
        
        {/* Twitter */}
        <meta name="twitter:title" content={`${profile?.displayName || 'Perfil'} | PackZinhu`} />
        <meta name="twitter:description" content={profile?.bio || "Confira meu conteúdo exclusivo no PackZinhu."} />
        <meta name="twitter:image" content={profile?.photoURL || "https://packzinhu.online/banner-principal.jpeg"} />
      </Helmet>
      {/* Cover */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-r from-purple-900 to-pink-900 rounded-b-3xl relative overflow-hidden">
        {profile.coverURL && (
          <CachedImage
            src={profile.coverURL}
            alt="Cover"
            className="w-full h-full object-cover opacity-50"
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-24 mb-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <PremiumAvatar
              borderStyle={profile?.borderStyle}
              className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-black"
            >
              <CachedImage
                src={
                  profile.photoURL ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`
                }
                alt="Profile"
                className="w-full h-full object-cover bg-white/5"
              />
            </PremiumAvatar>
          </div>
          <div className="flex-1 text-center sm:text-left pt-16 sm:pt-24 relative">
            <div
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-2"
              title="Admin Verificado"
            >
              <div className="flex items-center gap-2">
                <PremiumName
                  fontStyle={profile?.fontStyle}
                  badges={profile?.badges}
                  isVerified={profile?.isVerified}
                  isAdmin={
                    profile?.role === "admin" ||
                    profile.email === "dweminem@gmail.com" ||
                    profile.email === "contato.packzinhu@gmail.com"
                  }
                >
                  <h1 className="text-2xl sm:text-4xl font-black">
                    {profile.displayName}
                  </h1>
                </PremiumName>
              </div>
              {!isOwner && user && (
                <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4">
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`w-[80px] h-[32px] rounded-[8px] text-[12px] font-bold transition-all duration-300 flex items-center justify-center ${isFollowing ? "bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200 border border-blue-500/50 hover:bg-blue-500/40" : "bg-white text-black hover:bg-gray-200"}`}
                  >
                    {isFollowLoading
                      ? "..."
                      : isFollowing
                        ? "Seguindo"
                        : "Seguir"}
                  </button>
                  <button
                    onClick={() => navigate(`/chat/${id}`)}
                    className="w-[32px] h-[32px] rounded-[8px] bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Entrar em Contato"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -top-24 right-0 sm:static w-[90px] sm:w-[100px] h-[36px] sm:h-[40px] px-2 sm:px-4 py-1 sm:py-1.5 bg-white/10 text-white font-bold rounded-[17px] sm:rounded-[8px] hover:bg-white/20 transition-colors border border-white/20 flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs"
              >
                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Editar
              </button>
            )}

            {(profile.location || profile.website) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4 text-[12px] sm:text-sm text-gray-400">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span className="font-medium">
                      {profile.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 sm:gap-8 justify-center sm:justify-start text-[11px] sm:text-sm border-b border-white/5 pb-4 sm:pb-8 mb-4 sm:mb-8">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                <span className="font-black text-white">
                  {profile.followersCount || 0}
                </span>
                <span className="text-gray-400">Seguidores</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                <span className="font-black text-white">
                  {profile.followingCount || 0}
                </span>
                <span className="text-gray-400">Seguindo</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-white">
                  {profile.rating || "0.0"}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <span className="font-bold text-white">
                  {salesCount || profile.salesCount || 0}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                <span className="font-bold text-white">
                  {clientsCount || profile.clientsCount || 0}
                </span>
              </div>
            </div>

            {/* Pill Tabs Navigation */}
            <div className="flex items-center gap-1 sm:gap-2 mt-4 sm:mt-8 p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 w-fit mx-auto sm:mx-0">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 ${activeTab === "feed" ? "bg-gradient-to-r from-[#4ADE80] to-[#FACC15] text-black shadow-[0_0_20px_rgba(74,222,128,0.4)] scale-105" : "text-gray-400 hover:text-white"}`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 ${activeTab === "services" ? "bg-gradient-to-r from-[#4ADE80] to-[#FACC15] text-black shadow-[0_0_20px_rgba(74,222,128,0.4)] scale-105" : "text-gray-400 hover:text-white"}`}
              >
                Serviços
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 ${activeTab === "reviews" ? "bg-gradient-to-r from-[#4ADE80] to-[#FACC15] text-black shadow-[0_0_20px_rgba(74,222,128,0.4)] scale-105" : "text-gray-400 hover:text-white"}`}
              >
                Avaliações
              </button>
              <button
                onClick={() => setActiveTab("secret")}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 ${activeTab === "secret" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105" : "text-gray-400 hover:text-white"}`}
              >
                Exclusivos
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 sm:pt-24"></div>
        </div>

        {profile.bio && (
          <div className="mt-8 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold mb-2">Sobre mim</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {activeTab === "services" && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-400" /> Vitrine de
              Serviços
            </h3>

            {services.length === 0 ? (
              <div className="bg-[#1C1E32] p-8 rounded-2xl border border-white/5 text-center">
                <p className="text-gray-500">
                  Este usuário ainda não possui serviços.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {(services || []).map((service, index) => (
                  <motion.div
                    key={service?.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      delay: index * 0.05,
                    }}
                    whileHover={{
                      y: -10,
                      scale: 1.02,
                      boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)",
                    }}
                    className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden group transition-all duration-500 flex flex-col"
                  >
                    {/* Glass Shine Effect */}
                    <div className="glass-shine-effect" />

                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative aspect-[4/3] overflow-hidden bg-black/20 block">
                      {service?.coverUrl ? (
                        service?.coverType === "video" ||
                        service?.coverUrl?.includes(".mp4") ? (
                          <video
                            src={service.coverUrl}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={service.coverUrl}
                            alt={service?.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          Sem Imagem
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10 z-20">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-bold text-white">
                          {service?.rating || "Novo"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-5 flex flex-col flex-1 relative z-10">
                      <h4 className="font-bold text-sm sm:text-lg mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors duration-300">
                        {service?.title}
                      </h4>
                      <p className="text-[10px] sm:text-sm text-gray-400 line-clamp-2 mb-4 h-8 sm:h-10 leading-relaxed">
                        {service?.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                            Preço
                          </span>
                          <div className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                            R$ {(Number(service?.price) || 0).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="p-1.5 sm:p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all hover:scale-110 active:scale-95"
                              title="Deletar serviço"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handlePurchase(service)}
                            disabled={isPurchasing}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[10px] sm:text-xs font-black rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {isPurchasing ? "..." : "Comprar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />{" "}
              Avaliações dos Compradores
            </h3>

            {reviews.length === 0 ? (
              <div className="bg-[#1C1E32] p-8 rounded-2xl border border-white/5 text-center">
                <p className="text-gray-500">
                  Este usuário ainda não possui avaliações.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                          A
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            Comprador Anônimo
                          </div>
                          <div className="text-xs text-gray-500">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "Data não disponível"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 font-bold">
                          {review.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 italic">"{review.comment}"</p>
                    {review.serviceTitle && (
                      <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                        Serviço:{" "}
                        <span className="text-gray-400">
                          {review.serviceTitle}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "feed" && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-purple-400" /> Feed de
              Postagens
            </h3>

            {userPosts.length === 0 ? (
              <div className="bg-[#1C1E32] p-8 rounded-2xl border border-white/5 text-center">
                <p className="text-gray-500">
                  Este usuário ainda não publicou nada.
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl mx-auto">
                {userPosts.map((post) => {
                  const isLiked = userLikes.includes(post.id);
                  return (
                    <div
                      key={post.id}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Link to={`/profile/${post?.authorId}`}>
                            <img
                              src={
                                post?.authorPhoto ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post?.authorId}`
                              }
                              alt="Author"
                              className="w-10 h-10 rounded-full border border-white/10 object-cover"
                            />
                          </Link>
                          <div>
                            <Link
                              to={`/profile/${post?.authorId}`}
                              className="shining-name hover:opacity-80 transition-opacity"
                            >
                              {post?.authorName}
                            </Link>
                            <p className="text-xs text-gray-500">
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
                            onChange={(e) =>
                              setEditingPostContent(e.target.value)
                            }
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
                        <div className="w-full max-h-[500px] bg-black/20 flex items-center justify-center overflow-hidden">
                          {post?.mediaType === "video" ? (
                            <video
                              src={post.mediaUrl}
                              controls
                              className="max-w-full max-h-[500px] object-contain"
                            />
                          ) : (
                            <img
                              src={post.mediaUrl}
                              alt="Post media"
                              className="max-w-full max-h-[500px] object-contain"
                            />
                          )}
                        </div>
                      )}

                      <div className="p-4 border-t border-white/5 flex items-center gap-6">
                        <button
                          onClick={() =>
                            handleLike(
                              post.id,
                              post.likesCount || 0,
                              post.authorId,
                            )
                          }
                          disabled={isLikeLoading[post.id]}
                          className={`flex items-center gap-2 transition-colors disabled:opacity-50 ${isLiked ? "text-pink-500" : "text-gray-400 hover:text-pink-500"}`}
                        >
                          <Heart
                            className={`w-5 h-5 ${isLiked ? "fill-pink-500" : ""}`}
                          />
                          <span className="text-sm">
                            {post?.likesCount || 0}
                          </span>
                        </button>
                        <button
                          onClick={() => toggleComments(post.id)}
                          className={`flex items-center gap-2 transition-colors ${activeCommentPostId === post.id ? "text-purple-400" : "text-gray-400 hover:text-purple-400"}`}
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">
                            {post?.commentsCount || 0} Comentários
                          </span>
                        </button>
                        <button
                          onClick={() => handleBookmark(post.id)}
                          className={`flex items-center gap-2 transition-colors ${userBookmarks.includes(post.id) ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"}`}
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
                              alert(
                                "Link copiado para a área de transferência!",
                              );
                            }
                          }}
                          className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors ml-auto"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Comments Section */}
                      {activeCommentPostId === post?.id && (
                        <div className="bg-black/20 p-4 border-t border-white/5">
                          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                            {comments[post.id]?.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center">
                                Nenhum comentário ainda.
                              </p>
                            ) : (
                              (comments[post.id] || []).map((comment) => {
                                const isPremium =
                                  comment?.is_premium ||
                                  comment?.text?.startsWith(
                                    "[PREMIUM_COMMENT]",
                                  );
                                const commentText =
                                  isPremium &&
                                  comment?.text?.startsWith("[PREMIUM_COMMENT]")
                                    ? comment.text.replace(
                                        "[PREMIUM_COMMENT]",
                                        "",
                                      )
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
                                    />
                                    <div
                                      className={`flex-1 rounded-2xl rounded-tl-none p-3 relative group border ${
                                        isPremium
                                          ? "bg-gradient-to-br from-purple-600/20 via-zinc-800 to-pink-600/20 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] overflow-hidden"
                                          : "bg-white/10 border-white/5"
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
                                              setEditingCommentText(
                                                e.target.value,
                                              )
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
                                                handleSaveCommentEdit(
                                                  comment.id,
                                                )
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
                                disabled={
                                  !commentText.trim() || isCommentLoading
                                }
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
        )}

        {activeTab === "secret" && (
          <SecretContentSection userId={id!} isOwner={isOwner} />
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm modal-enter">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
              <h2 className="text-xl font-bold">Editar Perfil</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Biografia
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Foto de Perfil ({photoProgress > 0 && photoProgress < 100 ? `${Math.round(photoProgress)}%` : "suporta GIF"})
                </label>
                <div className="flex items-center gap-4">
                  {editPhoto && (
                    <img
                      src={editPhoto}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                  )}
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept="image/*,video/*,.gif"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          let file = e.target.files[0];
                          if (file.size > 10 * 1024 * 1024) {
                            alert("Foto de perfil muito grande. Máximo 10MB.");
                            return;
                          }
                          setUploading(true);
                          setPhotoProgress(0);
                          try {
                            if (file.type.startsWith('image/') && file.type !== 'image/gif') {
                              file = await compressImage(file, 800, 800, 0.8);
                            }
                            const url = await handleFileUpload(file, "profile", (p) => setPhotoProgress(p));
                            if (url) setEditPhoto(url);
                          } catch (err) {
                            console.error("Error uploading photo:", err);
                            alert("Erro ao enviar imagem. Tente novamente.");
                          } finally {
                            setUploading(false);
                            setPhotoProgress(0);
                          }
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 cursor-pointer"
                    />
                    {photoProgress > 0 && photoProgress < 100 && (
                      <div className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all" style={{ width: `${photoProgress}%` }} />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Capa do Perfil ({coverProgress > 0 && coverProgress < 100 ? `${Math.round(coverProgress)}%` : "suporta GIF"})
                </label>
                <div className="flex items-center gap-4">
                  {editCover && (
                    <img
                      src={editCover}
                      alt="Preview"
                      className="w-20 h-12 rounded-lg object-cover border border-white/10"
                    />
                  )}
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept="image/*,video/*,.gif"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          let file = e.target.files[0];
                          if (file.size > 10 * 1024 * 1024) {
                            alert("Capa muito grande. Máximo 10MB para imagens.");
                            return;
                          }
                          setUploading(true);
                          setCoverProgress(0);
                          try {
                            if (file.type.startsWith('image/') && file.type !== 'image/gif') {
                              file = await compressImage(file, 1600, 800, 0.8);
                            }
                            const url = await handleFileUpload(file, "banner", (p) => setCoverProgress(p));
                            if (url) setEditCover(url);
                          } catch (err) {
                            console.error("Error uploading cover:", err);
                            alert("Erro ao enviar capa. Tente novamente.");
                          } finally {
                            setUploading(false);
                            setCoverProgress(0);
                          }
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 cursor-pointer"
                    />
                    {coverProgress > 0 && coverProgress < 100 && (
                      <div className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all" style={{ width: `${coverProgress}%` }} />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                  className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://www.seusite.com"
                  className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" /> Configurações de
                  Notificação
                </h3>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-sm font-bold">Sons de Notificação</p>
                      <p className="text-[10px] text-gray-500">
                        Ativar/Desativar sons do site
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? "bg-purple-600" : "bg-gray-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#131524] rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-bold">
                        Notificações no Navegador
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Receber alertas mesmo fora do site
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setBrowserNotificationsEnabled(
                        !browserNotificationsEnabled,
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${browserNotificationsEnabled ? "bg-purple-600" : "bg-gray-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${browserNotificationsEnabled ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Testar Sons
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => playSound("message")}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-3 h-3" /> Mensagem
                    </button>
                    <button
                      onClick={() => playSound("order")}
                      className="px-3 py-2 bg-[#131524] hover:bg-white/5 border border-white/5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-3 h-3" /> Venda
                    </button>
                    <button
                      onClick={() => playSound("like")}
                      className="px-3 py-2 bg-[#131524] hover:bg-white/5 border border-white/5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Heart className="w-3 h-3" /> Curtida
                    </button>
                    <button
                      onClick={() => playSound("follow")}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="w-3 h-3" /> Seguidor
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end gap-2 bg-black/40">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={uploading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {uploading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PremiumBackground>
  );
}
