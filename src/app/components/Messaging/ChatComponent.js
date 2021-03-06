import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { 
  logout, 
  loginConfirmed,
  connectToChatServer,
  socket
} from 'reduxFiles/dispatchers/authDispatchers';
import { FormattedMessage, injectIntl } from 'react-intl';
import {
  dispatchSentMessage
} from 'reduxFiles/dispatchers/chatDispatchers';
import { 
  TextInput, 
  TouchableOpacity, 
  Text, 
  View, 
  ScrollView,
  Image
} from 'react-native';
import { setUserToChat } from 'reduxFiles/dispatchers/chatDispatchers';
import CloseIcon from '@material-ui/icons/Close';
import styles from './styling/styles';

class ChatComponent extends React.Component { 
  state = {
    message: ''
  }

  tempStoreMessage = message => {
    this.setState({message});
  }

  sendMessage = () => {
    const { storeSentMessages, chatInfo: { selectedUser, messages }, genInfo: { info: { uid } } } = this.props;
    const message = this.state.message;
    const messageObj = {message, recipient: selectedUser, sender: uid};
    if (message.length) {
      let newMessages = Object.assign({}, messages);
      if (newMessages[selectedUser]) newMessages[selectedUser].push(messageObj);
      else newMessages[selectedUser] = [messageObj];
      storeSentMessages(newMessages)
      socket.emit('sent-message', messageObj);
      this.setState({message:''});
    }
    else console.log('empty message')
  }

  closeChat = () => {
    const { selectUserToChat } = this.props;
    selectUserToChat(null);
  }

  render(){
    const { chatInfo: { selectedUser, messages, onlineUsers }, friendsInfo: { users }, genInfo: { info: { uid } }, intl } = this.props;
    const enabledSend = (this.state.message).length; 
    const displayMessages = () => {
      return (
        <View style={styles.messagesSubContainer}>
          { 
            Object.keys(messages).map(key => {
              const usersMessages = messages[key];
              // display messages from selected user
              if (String(key) === String(selectedUser)) {
                return <View key={key} style={ styles.messagesSubContainer }>
                  {
                    Object.keys(usersMessages).map(key => {
                      const sender = usersMessages[key].sender;
                      const message = usersMessages[key].message;
                      if (String(sender) === String(selectedUser)) {
                        return (
                          <View key={key} style={styles.recievedContainer}>
                            <Text style={styles.recievedMsg}>{ message }</Text>
                          </View>
                        )
                      }
                      else if (String(sender) === String(uid)) {
                        return (
                          <View key={key} style={styles.sentContainer}>
                            <Text style={styles.sentMsg}>{ message }</Text>
                          </View>
                        )
                      }
                      else return;
                    })
                  }
                </View>
              }
            })
          }
        </View>
      )
    }

    return (
      <View style={styles.chatContainer}>
        <View style={styles.userInfoContainer}>
          {
            users.map(user => {
              if (user.uid === selectedUser ) return (
                <View key={user.uid} style={styles.userInfo}>
                  <Image alt={ uid } style={styles.roundPic} source={user.avatar} />
                  <Text style={styles.userTextInfoContainer}>
                    <Text style={styles.username}>{ user.dname }</Text>
                    <Text style={styles.availability}><FormattedMessage id={onlineUsers[selectedUser] ? "user.online" : "user.offline"} /></Text>
                  </Text>
                  <TouchableOpacity onPress={this.closeChat} style={styles.closeButton}>
                    <CloseIcon style={styles.closeButtonText} />
                  </TouchableOpacity>
                </View>
              )
            })
          }
        </View>
        <ScrollView 
          ref={ref => this.scrollView = ref}
          onContentSizeChange={() => {        
              this.scrollView.scrollToEnd({animated: true});
          }}
          style={styles.messagesContainer}
        >
          {displayMessages()}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput 
            value={this.state.message}
            onKeyPress={ event => {
              if ((event.key).toLowerCase() === 'enter') this.sendMessage()
            }}
            onChangeText={this.tempStoreMessage}
            style={styles.input} 
            placeholder={intl.formatMessage({id:'chat.chatTextFieldPlaceholder'})}
          />
          <TouchableOpacity disabled={!enabledSend} onPress={this.sendMessage} style={enabledSend ? styles.button : styles.disabledButton} >
            <Text style={styles.buttonText}>{intl.formatMessage({id:'chat.send'})}</Text>
          </TouchableOpacity> 
        </View>
      </View>
    )
  }
}

ChatComponent.propTypes = {
  genInfo: PropTypes.object.isRequired,
  chatInfo: PropTypes.object.isRequired,
  friendsInfo: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  getUsers: PropTypes.func,
  getFriends: PropTypes.func,
  logingStatusConfirmation: PropTypes.func,
  openSocket: PropTypes.func,
  confirmLoggedIn: PropTypes.func,
  updateGenInfo: PropTypes.func,
  storeSentMessages: PropTypes.func,
  selectUserToChat: PropTypes.func
}

const mapStateToProps = state => {
  return {
      genInfo: state.genInfo,
      loginInfo: state.loginInfo,
      friendsInfo: state.friendsInfo,
      chatInfo: state.chatInfo
  }
}

const mapDispatchToProps = dispatch => {
  return {
      getUsers: () => {
          dispatch(fetchUsers());
      },
      getFriends: info => {
          dispatch(fetchFriends(info));
      },
      logingStatusConfirmation: (confirmLoggedIn, loginInfo) => {
          dispatch(checkLoginStatus(confirmLoggedIn, loginInfo));
      },
      openSocket: props => {
          dispatch(connectToChatServer(props));
      },
      confirmLoggedIn: () => {
          dispatch(loginConfirmed());
      },
      updateGenInfo: genInfo => {
          dispatch(dispatchedGenInfo(genInfo));
      },
      storeSentMessages: message => {
          dispatch(dispatchSentMessage(message))
      },
      selectUserToChat: userId => {
        dispatch(setUserToChat(userId))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(ChatComponent));