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
  // 単位のデータを取得
  const units = food_data["単位"][0];

  // 栄養素とその単位を組み合わせて表示
  const displayNutrientWithUnit = (nutrientName, total) => {
    const unit = units[nutrientName];
    return `${nutrientName}: ${total.toFixed(2)} ${unit}`;
  };
  // タンパク質、脂質、炭水化物、ビタミンA、ビタミンE、ビタミンＢ１、ビタミンB２、ビタミンC、食塩相当量、鉄
  const handleSelectFood = (food) => {
    setSelectedFoods([...selectedFoods, { ...food, grams: 100 }]);
  };

  const handleGramChange = (index, grams) => {
    const updatedFoods = selectedFoods.map((food, idx) => {
      if (index === idx) {
        return { ...food, grams: parseInt(grams, 10) || 100 };
      }
      return food;
    });
    setSelectedFoods(updatedFoods);
  };

  const calculateTotalNutrients = (nutrientName) => {
    return selectedFoods.reduce((total, food) => {
      const nutrientValue = parseFloat(food[nutrientName]);
      const grams = parseFloat(food.grams) || 100;
      return (
        total +
        (!isNaN(nutrientValue) && !isNaN(grams)
          ? (nutrientValue * grams) / 100
          : 0)
      );
    }, 0);
  };

  // 各栄養素の名前のリスト（カロリーとカルシウムも含む）
  const nutrientNames = [
    "エネルギー",
    "カ ル シ ウ ム",
    "たんぱく質",
    "脂質",
    "炭水化物",
    "ビタミンA",
    "ビタミンE",
    "ビタミンB1",
    "ビタミンB2",
    "ビタミンC",
    "食塩相当量",
    "鉄",
  ];
  // 各栄養素の合計値を計算
  const nutrientTotals = nutrientNames.map((nutrientName) => ({
    name: nutrientName,
    total: calculateTotalNutrients(nutrientName),
  }));

  const handleRemoveFood = (index) => {
    const updatedFoods = selectedFoods.filter((_, idx) => idx !== index);
    setSelectedFoods(updatedFoods);
  };

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
            foodInfo: selectedFoods, // 食品情報
            nutrients: nutrientTotals, // 栄養素の合計値
            units: units,
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
                  {nutrientTotals.map((nutrient, index) => (
                    <Text key={index}>{`${
                      nutrient.name
                    }: ${nutrient.total.toFixed(1)}`}</Text>
                  ))}
                </Text>
              </View>
            ))}
            <Text>
              ()内の数値は推定値を表しています。合計値には反映されません。
            </Text>
            <Text>
              Trは極微小であることを表しています。合計値には反映されません。
            </Text>
            <View>
              {nutrientTotals.map((nutrient, index) => (
                <Text key={index}>
                  {displayNutrientWithUnit(nutrient.name, nutrient.total)}
                </Text>
              ))}
            </View>
          </View>
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
