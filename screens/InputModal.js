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
import food_data from "../food_data/food_data.json";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);

  const handleSearch = () => {
    const results = food_data["食品一覧"].filter((item) =>
      item["食　品　名"].toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };
  // const handleSelectFood = (food) => {
  //   setSelectedFoods([...selectedFoods, food]);
  // };
  const handleSelectFood = (food) => {
    setSelectedFoods([...selectedFoods, { ...food, grams: 100 }]);
  };

  const handleGramChange = (index, grams) => {
    const updatedFoods = selectedFoods.map((food, idx) => {
      if (index === idx) {
        return { ...food, grams: parseInt(grams, 10) || 100 }; // グラム数を整数に変換
      }
      return food;
    });
    setSelectedFoods(updatedFoods);
  };

  const totalEnergy = selectedFoods.reduce((total, food) => {
    return (
      total +
      (food["エネルギー"] !== undefined && food["エネルギー"] !== null
        ? (food["エネルギー"] * (food.grams || 100)) / 100
        : 0)
    );
  }, 0);

  const totalCalcium = selectedFoods.reduce((total, food) => {
    const calciumValue = parseFloat(food["カ ル シ ウ ム"]);
    const grams = parseFloat(food.grams) || 100;

    return (
      total +
      (!isNaN(calciumValue) && !isNaN(grams) ? (calciumValue * grams) / 100 : 0)
    );
  }, 0);
  const handleRemoveFood = (index) => {
    const updatedFoods = selectedFoods.filter((_, idx) => idx !== index);
    setSelectedFoods(updatedFoods);
  };
  const foodInfo = selectedFoods.map((food) => ({
    name: food["食　品　名"],
    energy: food["エネルギー"],
    calcium: food["カ ル シ ウ ム"],
    ggrams: food.grams || 100,
  }));

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
    const foodInfo = selectedFoods.map((food) => ({
      name: food["食　品　名"],
      energy: food["エネルギー"],
      calcium: food["カ ル シ ウ ム"],
      grams: food.grams || 100, // 未定義の場合はデフォルト値を使用
    }));
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
            foodInfo,
            totalEnergy,
            totalCalcium,
          };
          set(newImageRef, imageData);

          setSelectedImage(null);
          setImageTitle("");
          setImageDescription("");
          setUploadProgress(0);
          setSelectedFoods([]);
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
            placeholder="食品名を入力"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <Button title="検索" onPress={handleSearch} />
          {searchResults.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <Text>{item["食　品　名"]}</Text>
              <Button title="選択" onPress={() => handleSelectFood(item)} />
            </View>
          ))}
          <View>
            {selectedFoods.map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <Text>{food["食　品　名"]}</Text>
                <TextInput
                  style={styles.gramInput}
                  onChangeText={(text) => handleGramChange(index, text)}
                  value={food.grams || "100"}
                  keyboardType="numeric"
                />
                <Button title="消去" onPress={() => handleRemoveFood(index)} />
                <Text>
                  {food["エネルギー"] !== undefined &&
                  food["エネルギー"] !== null
                    ? `${(food["エネルギー"] * (food.grams || 100)) / 100} kcal`
                    : "エネルギー情報なし"}
                </Text>
                <Text>
                  {food["カ ル シ ウ ム"] !== undefined &&
                  food["カ ル シ ウ ム"] !== null
                    ? isNaN(food["カ ル シ ウ ム"])
                      ? `${food["カ ル シ ウ ム"]} mg` // 数値でない場合はそのまま表示
                      : `${(
                          (parseFloat(food["カ ル シ ウ ム"]) *
                            (parseFloat(food.grams) || 100)) /
                          100
                        ).toFixed(2)} mg` // 数値の場合は計算して表示
                    : "カルシウム情報なし"}
                </Text>
              </View>
            ))}
          </View>

          <Text>合計エネルギー: {totalEnergy} kcal</Text>
          <Text>合計カルシウム: {totalCalcium} mg</Text>
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
