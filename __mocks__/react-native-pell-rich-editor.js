const React = require("react");
const { View, TouchableOpacity, Text } = require("react-native");

const actions = {
  setBold: "setBold",
  setItalic: "setItalic",
  setUnderline: "setUnderline",
  setStrikethrough: "setStrikethrough",
  insertBulletsList: "insertBulletsList",
  insertOrderedList: "insertOrderedList",
  insertImage: "insertImage",
};

class RichEditor extends React.Component {
  insertImage(url) {
    if (this.props.onChange) {
      this.props.onChange(`<p><img src="${url}"></p>`);
    }
  }

  render() {
    return React.createElement(View, {
      testID: this.props.testID ?? "rich-editor",
    });
  }
}

function RichToolbar({ onPressAddImage, testID }) {
  return React.createElement(
    View,
    { testID: testID ?? "rich-toolbar" },
    React.createElement(
      TouchableOpacity,
      { testID: "toolbar-insert-image", onPress: onPressAddImage },
      React.createElement(Text, null, "image"),
    ),
  );
}

RichEditor.prototype.render = function render() {
  return React.createElement(
    View,
    { testID: this.props.testID ?? "rich-editor" },
    React.createElement(
      TouchableOpacity,
      {
        testID: "rich-editor-set-content",
        onPress: () => {
          if (this.props.onChange) {
            this.props.onChange("<p>Bonjour</p>");
          }
        },
      },
      React.createElement(Text, null, "set-content"),
    ),
  );
};

module.exports = { RichEditor, RichToolbar, actions };
