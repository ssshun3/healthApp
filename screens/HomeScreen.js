import React, { useState, useEffect, useRef } from "react";
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
import { AntDesign } from "@expo/vector-icons";
export const HomeScreen = ({ route }) => {
  const { userId } = route.params;
  const scrollViewRef = useRef();
  const navigation = useNavigation();
  const [imageData, setImageData] = useState([]);

  useEffect(() => {
    const imagesRef = dbRef(database, `users/${userId}/images`);
    const unsubscribe = onValue(imagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setImageData(Object.values(data));
      }
    });

    // アンマウント時にリスナーを解除する
    return () => unsubscribe();
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
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current.scrollToEnd({ animated: false })
        }
        style={styles.scrollContainer}
      >
        {imageData.map((data, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: data.url }} style={styles.image} />
            <View style={styles.imageDetails}>
              <Text style={styles.titleText}>{data.title}</Text>
              <Text style={styles.descriptionText}>{data.description}</Text>
              <Text style={styles.dateText}>{data.date}</Text>
              {data.foodInfo &&
                data.foodInfo.map((food, idx) => (
                  <Text key={idx}>
                    {food.name}: {food.grams}g
                  </Text>
                ))}

              <Text>合計エネルギー: {data.totalEnergy} kcal</Text>
              <Text>合計カルシウム: {data.totalCalcium} mg</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteImage(data.ref)}
              >
                <AntDesign name="delete" size={24} color="black" />
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
  dateText: {
    color: "darkgrey",
  },
  scrollContainer: {
    width: "100%",
  },
  imageContainer: {
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#87cefa",
    borderRadius: 10,
    width: "100%",
  },
  image: {
    width: "100%",
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
