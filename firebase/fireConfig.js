// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
	getFirestore,
	collection,
	addDoc,
	FieldValue,
} from "firebase/firestore";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDDNKMMpkDiSChXv8oJ3GrzG_Jny7_rn9E",
	authDomain: "next-plate.firebaseapp.com",
	projectId: "next-plate",
	storageBucket: "next-plate.appspot.com",
	messagingSenderId: "1017735640713",
	appId: "1:1017735640713:web:1839ec988c2d613f863858",
	measurementId: "${config.measurementId}",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const increment = firebase.firestore.FieldValue.increment(1);
const decrement = firebase.firestore.FieldValue.increment(-1);
const incrementArgs = (value) => firebase.firestore.FieldValue.increment(value);
const decrementArgs = (value) =>
	firebase.firestore.FieldValue.increment(-value);

export { db, increment, decrement, incrementArgs, decrementArgs };
