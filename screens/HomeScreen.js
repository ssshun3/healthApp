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

export const HomeScreen = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation();
  const [imageData, setImageData] = useState([]);

  useEffect(() => {
    const imagesRef = dbRef(database, `users/${userId}/images`);
    onValue(imagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setImageData(Object.values(data));
      }
    });
  }, [userId]);
  const deleteImage = async (imageName) => {
    const fileRef = ref(storage, `users/${userId}/images/${imageName}`);
    await deleteObject(fileRef)
      .then(() => {
        setImageData((prevData) =>
          prevData.filter((data) => data.ref !== imageName)
        );
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
      <Button
        title="新しい画像を追加"
        onPress={() => navigation.navigate("InputModal", { userId })}
      />
      <Button
        title="ログアウト"
        onPress={() => navigation.navigate("LogOut")}
      />
    </View>
  );
};

// スタイルは InputScreen のものを使用
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
    width: 250,
    height: 200,
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
  picButton: {
    backgroundColor: "blue",
  },
});
