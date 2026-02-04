import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDgtlF6YRbl4_wlDEbNSVlGq1Jw6wmWx2w",
  authDomain: "tareas-app-484fd.firebaseapp.com",
  projectId: "tareas-app-484fd",
  storageBucket: "tareas-app-484fd.firebasestorage.app",
  messagingSenderId: "358225646307",
  appId: "1:358225646307:web:9537b151fc299e3c2bebd6"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
