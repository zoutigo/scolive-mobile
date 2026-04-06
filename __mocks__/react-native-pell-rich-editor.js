const React = require("react");
const { View, TouchableOpacity, Text } = require("react-native");
const { jest: jestGlobals } = require("@jest/globals");

const mockEditorMethods = {
  insertImage: jestGlobals.fn(),
  setForeColor: jestGlobals.fn(),
  command: jestGlobals.fn(),
};

let mockContentHtml = "";

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
    mockEditorMethods.insertImage(url);
    mockContentHtml = `<p><img src="${url}"></p>`;
    if (this.props.onChange) {
      this.props.onChange(mockContentHtml);
    }
  }

  setForeColor(color) {
    mockEditorMethods.setForeColor(color);
  }

  command(command) {
    mockEditorMethods.command(command);
  }

  getContentHtml() {
    return Promise.resolve(mockContentHtml);
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
          mockContentHtml = "<p>Bonjour</p>";
          if (this.props.onChange) {
            this.props.onChange(mockContentHtml);
          }
        },
      },
      React.createElement(Text, null, "set-content"),
    ),
  );
};

module.exports = {
  RichEditor,
  RichToolbar,
  actions,
  __mockEditorMethods: mockEditorMethods,
  __setMockEditorContentHtml: (html) => {
    mockContentHtml = html;
  },
};
