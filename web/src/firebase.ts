import firebase from "firebase/app";
import "firebase/database";
import "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDKzFXdJrFwtyNRaSs1KEfEIAeSSSkWAko",
  authDomain: "dice-roller-c518a.firebaseapp.com",
  databaseURL: "https://dice-roller-c518a.firebaseio.com",
  projectId: "dice-roller-c518a",
  storageBucket: "dice-roller-c518a.appspot.com",
  messagingSenderId: "156397029967",
  appId: "1:156397029967:web:c78eda7d63664da4b7b83a",
  measurementId: "G-2PCZVSC01Z"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

const db = firebase.database();

export { db };
