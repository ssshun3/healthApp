import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage, database } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { set, ref as dbRef } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";
LocaleConfig.locales.jp = {
  monthNames: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  monthNamesShort: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  dayNames: [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ],
  dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
};
LocaleConfig.defaultLocale = "jp";
export const InputModal = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
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
            date: new Date().toLocaleDateString(),
          };
          set(newImageRef, imageData); // データベースに画像データを保存

          // アップロード成功後に画像の選択をリセット
          setSelectedImage(null);
          setImageTitle("");
          setImageDescription("");
          setUploadProgress(0);
          navigation.navigate("Home", { userId });
        });
      }
    );
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        <View>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
            />
          )}
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
          <Calendar
            monthFormat={"yyyy年 M月"}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
            }}
            enableSwipeMonths={true}
          />

          <Text>選択された日付: {selectedDate}</Text>
          <Button title="アップロード" onPress={uploadImage} />
        </View>
      </ScrollView>
      <Text>アップロード進捗: {uploadProgress.toFixed(2)}%</Text>
      <Button title="写真をえらべ！" onPress={pickImageAsync} />
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
  textInput: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  selectedImage: {
    width: "100%", // コンテナの幅に合わせる
    height: 200, // 高さは固定（必要に応じて調整）
    resizeMode: "contain", // 画像がコンテナ内に収まるように調整
  },
});
