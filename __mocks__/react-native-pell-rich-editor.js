const React = require("react");
const { View, TouchableOpacity, Text } = require("react-native");
const { jest: jestGlobals } = require("@jest/globals");

const mockEditorMethods = {
  insertImage: jestGlobals.fn(),
  setForeColor: jestGlobals.fn(),
  command: jestGlobals.fn(),
  commandDOM: jestGlobals.fn(),
  setContentHTML: jestGlobals.fn(),
  focusContentEditor: jestGlobals.fn(),
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
  insertImage(url, style) {
    mockEditorMethods.insertImage(url, style);
    mockContentHtml = `<p><img src="${url}" style="${style ?? ""}"></p>`;
    if (this.props.onChange) {
      this.props.onChange(mockContentHtml);
    }
  }

  setForeColor(color) {
    mockEditorMethods.setForeColor(color);
  }

  command(js) {
    mockEditorMethods.command(js);
  }

  commandDOM(js) {
    mockEditorMethods.commandDOM(js);
  }

  setContentHTML(html) {
    mockEditorMethods.setContentHTML(html);
    mockContentHtml = html;
  }

  focusContentEditor() {
    mockEditorMethods.focusContentEditor();
  }

  getContentHtml() {
    return Promise.resolve(mockContentHtml);
  }

  /** Simulate an incoming message from the WebView (for testing onMessage) */
  static simulateMessage(instance, message) {
    if (instance && instance.props.onMessage) {
      instance.props.onMessage(message);
    }
  }

  render() {
    // call editorInitializedCallback synchronously to simulate editor ready
    if (this.props.editorInitializedCallback && !this.__initCalled) {
      this.__initCalled = true;
      setTimeout(() => this.props.editorInitializedCallback?.(), 0);
    }
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
            // Simulate the WebView reporting a taller content area after text is added
            if (this.props.onHeightChange) {
              this.props.onHeightChange(320);
            }
          },
        },
        React.createElement(Text, null, "set-content"),
      ),
      React.createElement(
        TouchableOpacity,
        {
          testID: "rich-editor-simulate-height-change",
          onPress: () => {
            if (this.props.onHeightChange) {
              this.props.onHeightChange(480);
            }
          },
        },
        React.createElement(Text, null, "height-change"),
      ),
      React.createElement(
        TouchableOpacity,
        {
          testID: "rich-editor-simulate-image-tap",
          onPress: () => {
            if (this.props.onMessage) {
              this.props.onMessage({
                type: "IMAGE_TAPPED",
                id: "img_1",
                size: null,
                align: null,
              });
            }
          },
        },
        React.createElement(Text, null, "tap-image"),
      ),
      React.createElement(
        TouchableOpacity,
        {
          testID: "rich-editor-simulate-click-outside",
          onPress: () => {
            if (this.props.onMessage) {
              this.props.onMessage({
                type: "CLICK_OUTSIDE_IMAGE",
              });
            }
          },
        },
        React.createElement(Text, null, "click-outside"),
      ),
    );
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

module.exports = {
  RichEditor,
  RichToolbar,
  actions,
  __mockEditorMethods: mockEditorMethods,
  __setMockEditorContentHtml: (html) => {
    mockContentHtml = html;
  },
};
