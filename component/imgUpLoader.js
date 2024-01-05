import React, { useState, useRef } from "react";
import { StyleSheet, View, Text, Button } from "react-native";
import ImageViewer from "./ImgView";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import storage from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const PlaceholderImage = require("../assets/icon.png");
export const ImageUploader = () => {
  // const imageRef = useRef();
  // const [status, requestPermission] = MediaLibrary.usePermissions();
  // const [selectedImage, setSelectedImage] = useState(null);
  // const pickImageAsync = async () => {
  //   let result = await ImagePicker.launchImageLibraryAsync({
  //     allowsEditing: true,
  //     quality: 1,
  //   });

  //   if (!result.canceled) {
  //     setSelectedImage(result.assets[0].uri);
  //     setShowAppOptions(true);
  //   } else {
  //     alert("You did not select any image.");
  //   }
  // };
  // if (status === null) {
  //   requestPermission();
  // }
  // const [loading, setLoading] = useState(false);
  // const [isUp, setIsUp] = useState(false);

  // const OnFileUpload = (e) => {
  //   const file = e.target.files[0];
  //   const storageRef = ref(storage, "image/" + file.name);
  //   const uploadimg = uploadBytesResumable(storageRef, file);
  //   uploadimg.on(
  //     "state_changed",
  //     (snapshot) => {
  //       setLoading(true);
  //     },
  //     (err) => {
  //       console.log(err);
  //     },
  //     () => {
  //       setLoading(false);
  //       setIsUp(true);
  //     }
  //   );
  // };
  const OnImgUp = () => {
    // Upload file and metadata to the object 'images/mountains.jpg'
    const storageRef = ref(storage, "images/" + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);
    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // アップロードされたバイト数とアップロードされる予定の総バイト数を含む、タスクの進捗状況を取得する。
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        switch (error.code) {
          case "storage/unauthorized":
            // ユーザーはオブジェクトにアクセスする権限を持っていない
            break;
          case "storage/canceled":
            // User canceled the upload
            break;

          case "storage/unknown":
            // Unknown error occurred, inspect error.serverResponse
            break;
        }
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log("File available at", downloadURL);
        });
      }
    );
  };
  return (
    <View>
      <View ref={imageRef} collapsable={false}>
        <ImageViewer
          placeholderImageSource={PlaceholderImage}
          selectedImage={selectedImage}
        />
      </View>
      {loading ? (
        <Text>アップロード中</Text>
      ) : (
        <View>
          {isUp ? (
            <Text>アップロード完了</Text>
          ) : (
            <View>
              <Text>画像アップローダー</Text>
              <Button
                theme="primary"
                title="写真をえらべ！"
                onPress={pickImageAsync}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
};
