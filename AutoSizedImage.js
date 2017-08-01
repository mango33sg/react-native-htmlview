import React from 'react';
import {
  Image,
  Dimensions,
} from 'react-native';

const width = Dimensions.get('window').width - 32;

const baseStyle = {
  backgroundColor: 'transparent',
};

export default class AutoSizedImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // set width 1 is for preventing the warning
      // You must specify a width and height for the image %s
      width: width,
      height: width,
    };
  }

  render() {
    const finalSize = {};
    if (this.state.width > width) {
      finalSize.width = width;
      const ratio = width / this.state.width;
      finalSize.height = this.state.height * ratio;
    }
    const style = Object.assign(
      baseStyle,
      this.props.style,
      this.state,
      finalSize
    );

    return (
      <Image
        onLayout={() => {
          Image.getSize(this.props.source.uri, (w, h) => {
            this.setState({
              width: w,
              height: h
            });
          });
        }}
        style={style}
        source={{ uri: this.props.source.uri }}
      />
    );
  }
}

