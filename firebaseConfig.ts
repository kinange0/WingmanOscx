
import { initializeApp } from 'https://esm.sh/firebase/app';
import { getAuth, GoogleAuthProvider } from 'https://esm.sh/firebase/auth';
import { getFirestore } from 'https://esm.sh/firebase/firestore';

// Note: In a production environment, these values should be securely managed.
// Replace these placeholders with your actual Firebase project configuration.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
