import React, { Component } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Image } from "react-native";
import * as Google from "expo-google-app-auth";
import firebase from "firebase";

export default class LoginScreen extends Component {
  isUserEqual = (googleUser, firebaseUser) => {
    if (firebaseUser) {
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (
          providerData[i].providerId ===
            firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
          providerData[i].uid === googleUser.getBasicProfile().getId()
        ) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  };

  onSignIn = (googleUser) => {
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    var unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
      unsubscribe();
      // Check if we are already signed-in Firebase with the correct user.
      if (!this.isUserEqual(googleUser, firebaseUser)) {
        // Build Firebase credential with the Google ID token.
        var credential = firebase.auth.GoogleAuthProvider.credential(
          googleUser.idToken,
          googleUser.accessToken
        );

        // Sign in with credential from the Google user.
        firebase
          .auth()
          .signInWithCredential(credential)
          .then(function (result) {
            if (result.additionalUserInfo.isNewUser) {
              firebase
                .database()
                .ref("/users/" + result.user.uid)
                .set({
                  gmail: result.user.email,
                  profile_picture: result.additionalUserInfo.profile.picture,
                  locale: result.additionalUserInfo.profile.locale,
                  first_name: result.additionalUserInfo.profile.given_name,
                  last_name: result.additionalUserInfo.profile.family_name,
                  current_theme: "dark",
                })
                .then(function (snapshot) {});
            }
          })
          .catch((error) => {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // ...
          });
      } else {
        console.log("User already signed-in Firebase.");
      }
    });
  };

  signInWithGoogleAsync = async () => {
    try {
      const result = await Google.logInAsync({
        behaviour: "web",
        androidClientId:
          "883167218713-s11qp4hshl81thk5233lhf9k0ss6m3kb.apps.googleusercontent.com",
        iosClientId:
          "883167218713-8o03jtbqht0oe08j3pum9k0paudirmfl.apps.googleusercontent.com",
        scopes: ["profile", "email"],
      });

      if (result.type === "success") {
        this.onSignIn(result);
        return result.accessToken;
      } else {
        return { cancelled: true };
      }
    } catch (e) {
      console.log(e.message);
      return { error: true };
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.logoText}>Spectagram</Text>
        </View>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => this.signInWithGoogleAsync()}
        >
          <Image
            source={require("../assets/google-sign-1.png")}
            style={styles.loginButtonImg1}
          />
          <Text style={styles.loginText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  logo: {
    height: 70,
    width: 75,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  logoText: {
    color: "white",
    fontWeight: "700",
    fontSize: 20,
    alignSelf: "center",
    marginTop: 2,
  },
  logoContainer: {
    height: 130,
    marginTop: 50,
    alignSelf: "center",
  },
  loginButton: {
    marginTop: 150,
    backgroundColor: "#4285F4",
    height: 70,
    width: 300,
    borderRadius: 5,
    alignSelf: "center",
  },
  loginButtonImg1: {
    height: 70,
    width: 70,
    margin: 1,
    backgroundColor: "white",
  },
  loginText: {
    color: "white",
    fontSize: 20,
    marginTop: -51,
    marginLeft: 95,
    fontWeight: "bold",
  },
});
