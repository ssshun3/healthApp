import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InputScreen } from "./screens/InputScreen";
import LoginScreen from "./screens/LoginScreen";
import LogOutScreen from "./screens/LogOutScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { InputModal } from "./screens/InputModal";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="InputModal" component={InputModal} />
        <Stack.Screen name="LogOut" component={LogOutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
