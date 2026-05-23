const firebaseConfig = {
  apiKey:            "AIzaSyB8lmVIMD-2SNC4vWacZ2G-2BYnLjhGES8",
  authDomain:        "happy-math-b1055.firebaseapp.com",
  projectId:         "happy-math-b1055",
  storageBucket:     "happy-math-b1055.firebasestorage.app",
  messagingSenderId: "118250828505",
  appId:             "1:118250828505:web:d4c4d79d065291ec9b04c8"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();