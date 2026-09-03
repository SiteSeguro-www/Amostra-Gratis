const fs = require('fs');
// Let's use the minio database as a proxy if it has the data, but it might not be up to date.
// We can use a node script to query the local firebase-admin.
