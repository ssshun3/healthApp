import React, { useState } from "react";
import { StyleSheet, View, Text, Button } from "react-native";
import Modal from "react-native-modal";
import { Calendar } from "react-native-calendars";
import { Icon } from "native-base";

const THEME_COLOR = "#36C1A7";

const formatDate = (date) => {
  let format = "YYYY-MM-DD";
  format = format.replace(/YYYY/g, date.getFullYear().toString());
  format = format.replace(/MM/g, ("0" + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/DD/g, ("0" + date.getDate()).slice(-2));
  return format;
};

const CommonCalendar = ({
  visible,
  defaultDate,
  minDate,
  maxDate,
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState(defaultDate || new Date());

  const handlePressDay = (date) => {
    setSelectedDate(new Date(date.year, date.month - 1, date.day));
  };

  const handlePressConfirmButton = () => {
    onConfirm && onConfirm(selectedDate);
  };

  const selectedDateText = formatDate(selectedDate);

  return (
    <Modal isVisible={visible}>
      <View style={styles.container}>
        <Text style={styles.title}>日付を選択してください</Text>
        <Calendar
          current={selectedDate}
          markedDates={{
            [selectedDateText]: { selected: true, selectedColor: THEME_COLOR },
          }}
          minDate={minDate}
          maxDate={maxDate}
          renderArrow={(direction) => (
            <Icon
              type="FontAwesome5"
              name={`arrow-${direction}`}
              style={styles.arrow}
            />
          )}
          theme={{ todayTextColor: THEME_COLOR }}
          onDayPress={handlePressDay}
        />
        <Button
          block
          style={styles.confirmButton}
          onPress={handlePressConfirmButton}
          title="決定"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    padding: "5%",
  },
  title: {
    color: THEME_COLOR,
    fontWeight: "bold",
    textAlign: "center",
  },
  arrow: {
    color: THEME_COLOR,
  },
  confirmButton: {
    marginTop: "5%",
    backgroundColor: "#FFF",
    borderColor: THEME_COLOR,
    borderWidth: 1,
    borderRadius: 10,
  },
});

export default CommonCalendar;
