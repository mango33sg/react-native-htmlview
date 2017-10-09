import React from 'react';
import {Text, View, Alert} from 'react-native';
import htmlparser from 'htmlparser2-without-node-native';
import entities from 'entities';

import AutoSizedImage from './AutoSizedImage';

const defaultOpts = {
  lineBreak: '\n',
  paragraphBreak: '\n\n',
  bullet: '\u2022 ',
  TextComponent: Text,
  textComponentProps: null,
  NodeComponent: Text,
  nodeComponentProps: null,
};

const Img = props => {
  const width =
    Number(props.attribs['width']) || Number(props.attribs['data-width']) || 0;
  const height =
    Number(props.attribs['height']) ||
    Number(props.attribs['data-height']) ||
    0;

  const source = {
    uri: props.attribs.src,
    width,
    height,
  };
  return <AutoSizedImage source={source} />;
};

export default function htmlToElement(rawHtml, customOpts = {}, done) {
  const opts = {
    ...defaultOpts,
    ...customOpts,
  };

  function domToElement(dom, parent) {
    if (!dom) return null;

    const renderNode = opts.customRenderer;

    return dom.map((node, index, list) => {
      if (renderNode) {
        const rendered = renderNode(
          node,
          index,
          list,
          parent,
          domToElement
        );
        if (rendered || rendered === null) return rendered;
      }

      const {TextComponent} = opts;
      const headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      let styleText = opts.componentProps.textNoTag;

      if (headers.includes(node.name)) {
        node.type = 'text';
        node.data = node.children[0].data;
        styleText = opts.componentProps.h1;
      }

      if (node.parent && node.parent.name === 'a') {
        styleText = opts.componentProps.a;
      }

      if (node.type == 'text') {
        return (
          <TextComponent
            {...opts.textComponentProps}
            {...styleText}
            key={index}
          >
            {entities.decodeHTML(node.data)}
          </TextComponent>
        );
      }

      if (node.type == 'tag') {
        if (node.name == 'img') {
          return <Img key={index} attribs={node.attribs} />;
        }

        let linkPressHandler = null;
        if (node.name == 'a' && node.attribs && node.attribs.href) {
          let href = node.attribs.href;
          const findHttp = /(http(s?)):\/\//gi;
          if (href.match(findHttp)) {
            linkPressHandler = () => {
              Alert.alert(
                '',
                'Are you sure you want to leave this page?',
                [
                  {text: 'Cancel'},
                  {
                    text: 'OK',
                    onPress: () => opts.linkHandler(entities.decodeHTML(node.attribs.href)),
                  },
                ],
              );
            };
          } else {
            //link internal apps
            console.log('node', node);
            linkPressHandler = () => {
              Alert.alert(
                '',
                'You will be directed to ' + node.attribs.class,
                [
                  {text: 'Cancel'},
                  {
                    text: 'OK',
                    onPress: () => opts.linkHandler(entities.decodeHTML(node.attribs.href)),
                  },
                ],
              );
            };
          }
        }
        let linebreakBefore = null;
        let linebreakAfter = null;
        if (opts.addLineBreaks) {
          switch (node.name) {
          case 'pre':
            linebreakBefore = opts.lineBreak;
            break;
          case 'p':
            if (index < list.length - 1) {
              linebreakAfter = opts.paragraphBreak;
            }
            break;
          case 'br':
            linebreakAfter = opts.lineBreak;
            break;
          case 'ul':
            linebreakAfter = opts.lineBreak;
            break;
          case 'li':
            linebreakAfter = opts.lineBreak;
            break;
          case 'ol':
            linebreakAfter = opts.lineBreak;
            break;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
            linebreakAfter = opts.lineBreak;
            break;
          case 'span':
            if (index < list.length - 1) {
              linebreakAfter = opts.lineBreak;
            }
            break;
          }
        }

        if (node.name === 'br') {
          linebreakAfter = opts.lineBreak;
        }


        let componentProps = null;
        if (opts.componentProps) {
          if (typeof opts.componentProps[node.name] !== 'undefined') {
            componentProps = opts.componentProps[node.name];
          }
        }

        if (node.name === 'p') {
          if (node.prev) {
            const tagBullet = ['ul', 'ol'];
            if (tagBullet.indexOf(node.prev.name) > -1) {
              componentProps = {
                style: {
                  marginVertical: 10,
                },
              };
            }
          }
          if (node.parent) {
            if (node.parent.name === 'li') {
              componentProps = {
                style: {
                  paddingBottom: -10,
                },
              };
            }
          }
        }

        if (node.name === 'ul' || node.name === 'ol') {
          componentProps = {
            style: {
              paddingBottom: 10,
            },
          };
        }

        let listItemPrefix = null;
        if (node.name == 'li') {
          const listItemStyle = opts.componentProps.textNoTag.style;
          if (parent.name == 'ol') {
            listItemPrefix = `${index + 1}. `;
          } else if (parent.name == 'ul') {
            listItemPrefix = `${opts.bullet}  `;
          }
          return (
            <View
              {...opts.nodeComponentProps}
              {...componentProps}
              key={index}
              onPress={linkPressHandler}
            >
              {linebreakBefore}
              <View>
                <Text {...node.children.componentProps} style={listItemStyle}>{listItemPrefix}</Text>
              </View>
              <View style={{flex: 1 }}>
                {domToElement(node.children, node)}
              </View>
              {linebreakAfter}
            </View>
          );
        }
        if (node.name == 'ol' || node.name == 'ul') {
          opts.NodeComponent = View;
        } else {
          opts.NodeComponent = Text;
        }

        const {NodeComponent} = opts;

        return (
          <NodeComponent
            {...opts.nodeComponentProps}
            {...componentProps}
            key={index}
            onPress={linkPressHandler}
          >
            {linebreakBefore}
            {listItemPrefix}
            {domToElement(node.children, node)}
            {linebreakAfter}
          </NodeComponent>
        );
      }
    });
  }

  const handler = new htmlparser.DomHandler(function(err, dom) {
    if (err) done(err);
    done(null, domToElement(dom));
  });
  const parser = new htmlparser.Parser(handler);
  parser.write(rawHtml);
  parser.done();
}
