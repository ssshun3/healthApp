import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage, database } from "../firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { set, ref as dbRef, onValue, remove } from "firebase/database";
import { useNavigation } from "@react-navigation/native";

export const InputScreen = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageTitle, setImageTitle] = useState(""); // 画像のタイトル
  const [imageDescription, setImageDescription] = useState(""); // 画像の説明
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageData, setImageData] = useState([]); // 画像のURLとRefを含むオブジェクトを保持する配列

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled) {
      setSelectedImage(result.uri);
    }
  };
  useEffect(() => {
    // ユーザー固有の画像データのパス
    const imagesRef = dbRef(database, `users/${userId}/images`);
    onValue(imagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setImageData(Object.values(data));
      }
    });
  }, [userId]);

  const uploadImage = async () => {
    if (!selectedImage) return;
    const response = await fetch(selectedImage);
    const blob = await response.blob();
    const fileRef = ref(storage, "images/" + new Date().getTime());
    const uploadTask = uploadBytesResumable(fileRef, blob);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const newImageRef = dbRef(
            database,
            `users/${userId}/images/${fileRef.name}`
          );
          const imageData = {
            url: downloadURL,
            ref: fileRef.name,
            title: imageTitle,
            description: imageDescription,
          };
          set(newImageRef, imageData); // データベースに画像データを保存

          // アップロード成功後に画像の選択をリセット
          setSelectedImage(null);
          setImageTitle("");
          setImageDescription("");
          setUploadProgress(0);
        });
      }
    );
  };

  const deleteImage = async (imageName) => {
    const fileRef = ref(storage, `users/${userId}/images/${imageName}`);
    await deleteObject(fileRef)
      .then(() => {
        setImageData((prevData) =>
          prevData.filter((data) => data.ref !== imageName)
        ); // 削除した画像を除外
      })
      .catch((error) => {
        console.error(error);
      });
    const dbImageRef = dbRef(database, `users/${userId}/images/${imageName}`);
    remove(dbImageRef);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {imageData.map((data, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: data.url }} style={styles.image} />
            <View style={styles.imageDetails}>
              <Text style={styles.titleText}>{data.title}</Text>
              <Text style={styles.descriptionText}>{data.description}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteImage(data.ref)}
              >
                <Text>削除</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      {selectedImage && (
        <View>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />

          <TextInput
            style={styles.textInput}
            placeholder="画像のタイトル"
            value={imageTitle}
            onChangeText={setImageTitle}
          />
          <TextInput
            style={styles.textInput}
            placeholder="画像の説明"
            value={imageDescription}
            onChangeText={setImageDescription}
          />
          <Button title="アップロード" onPress={uploadImage} />
        </View>
      )}
      <Text>アップロード進捗: {uploadProgress.toFixed(2)}%</Text>
      <Button title="写真をえらべ！" onPress={pickImageAsync} />
      <Button title="logout" onPress={() => navigation.navigate("LogOut")} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginRight: 10,
  },
  imageDetails: {
    flex: 1,
  },
  titleText: {
    fontWeight: "bold",
  },
  descriptionText: {
    color: "gray",
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 10,
    marginTop: 5,
  },
  textInput: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  selectedImage: {
    width: 200,
    height: 200,
  },
});
