import React, { Component } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import store from "./store";

export default class App extends Component {
  constructor(props) {
    super(props);
    store.subscribe(this);
    this.state = {
      ...store.mapState()
    };
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>{this.state.name}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});
