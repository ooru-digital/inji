import React, {useState, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  View,
  Text as RNText,
} from 'react-native';
import {Modal} from './ui/Modal';
import {Column, Text} from './ui';
import {Theme} from './ui/styleUtils';
import {BannerNotificationContainer} from './BannerNotificationContainer';
import getAllConfigurations from '../shared/api';
import {NativeModules} from 'react-native';
const {TrustFingerReactNativeModule} = NativeModules;

export const HelpScreen: React.FC<HelpScreenProps> = props => {
  const {t} = useTranslation('HelpScreen');
  const [showHelpPage, setShowHelpPage] = useState(false);
  const listingRef = useRef();
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [base64FeatureData, setBase64FeatureData] = useState<string | null>(
    null,
  );

  const captureBiometric = () => {
    TrustFingerReactNativeModule.captureBiometricData()
      .then(capturedBase64FeatureData => {
        console.log('Capture success:', capturedBase64FeatureData);
        setBase64FeatureData(capturedBase64FeatureData);
        setPopupMessage('Biometric data captured successfully');
        setTimeout(() => {
          setPopupMessage(null);
        }, 3000); // Clear message after 3 seconds
      })
      .catch(error => {
        console.error('Error capturing biometric data: ', error);
        setPopupMessage('Error capturing biometric data');
        setTimeout(() => {
          setPopupMessage(null);
        }, 3000); // Clear message after 3 seconds
      });
  };

  const verifyBiometric = () => {
    if (base64FeatureData) {
      TrustFingerReactNativeModule.verifyBiometricData(base64FeatureData)
        .then(message => {
          console.log('Verification message:', message);
          setPopupMessage('Fingerprint verification successful');
          setTimeout(() => {
            setPopupMessage(null);
          }, 3000); // Clear message after 3 seconds
        })
        .catch(error => {
          console.error('Error verifying biometric data: ', error);
          setPopupMessage('Fingerprint verification failed');
          setTimeout(() => {
            setPopupMessage(null);
          }, 3000); // Clear message after 3 seconds
        });
    } else {
      setPopupMessage('Please capture biometric data first');
      setTimeout(() => {
        setPopupMessage(null);
      }, 3000); // Clear message after 3 seconds
    }
  };

  const getTextField = (value: string, component?: React.ReactElement) => {
    return (
      <Text style={Theme.TextStyles.helpDetails}>
        {value} {component}
      </Text>
    );
  };

  const getLinkedText = (link: string, linkText: string) => {
    return (
      <Text
        style={Theme.TextStyles.urlLinkText}
        onPress={() => {
          Linking.openURL(link);
        }}>
        {linkText}
      </Text>
    );
  };

  const InjiFaqMap = [
    {
      title: t('questions.inji.one'),
      data: (
        <React.Fragment>{getTextField(t('answers.inji.one'))}</React.Fragment>
      ),
    },
    {
      title: t('questions.inji.two'),
      data: (
        <React.Fragment>
          {getTextField(
            t('answers.inji.two'),
            getLinkedText(
              'https://docs.mosip.io/1.2.0/id-lifecycle-management/identifiers',
              t('here'),
            ),
          )}
        </React.Fragment>
      ),
    },
    {
      title: t('questions.inji.three'),
      data: (
        <React.Fragment>{getTextField(t('answers.inji.three'))}</React.Fragment>
      ),
    },
    {
      title: t('questions.inji.four'),
      data: (
        <React.Fragment>{getTextField(t('answers.inji.four'))}</React.Fragment>
      ),
    },
  ];

  return (
    <React.Fragment>
      <Pressable
        accessible={false}
        onPress={() => {
          setShowHelpPage(!showHelpPage);
        }}>
        {props.triggerComponent}
      </Pressable>
      <Modal
        testID="helpScreen"
        isVisible={showHelpPage}
        headerTitle={t('header')}
        headerElevation={2}
        onDismiss={() => {
          setShowHelpPage(!showHelpPage);
        }}>
        <BannerNotificationContainer />
        <SafeAreaView style={{flex: 1}}>
          <Column fill padding="10" align="space-between">
            <FlatList
              ref={listingRef}
              keyExtractor={(item, index) => 'FAQ' + index.toString()}
              renderItem={({item}) => (
                <View>
                  <Text style={Theme.TextStyles.helpHeader}>{item.title}</Text>
                  {item.data}
                </View>
              )}
              data={[...InjiFaqMap]}
              onScrollToIndexFailed={info => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  listingRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  });
                });
              }}
            />
          </Column>
        </SafeAreaView>
        <View style={{padding: 10}}>
          <Pressable
            style={{
              backgroundColor: '#007bff',
              padding: 10,
              alignItems: 'center',
              borderRadius: 5,
            }}
            onPress={captureBiometric}>
            <Text style={{color: 'white'}}>Capture Biometric</Text>
          </Pressable>
          <Pressable
            style={{
              marginTop: 10,
              backgroundColor: '#28a745',
              padding: 10,
              alignItems: 'center',
              borderRadius: 5,
            }}
            onPress={verifyBiometric}>
            <Text style={{color: 'white'}}>Verify Biometric</Text>
          </Pressable>
        </View>
      </Modal>
      {popupMessage && (
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 10,
            borderRadius: 5,
          }}>
          <RNText style={{color: 'white', textAlign: 'center'}}>
            {popupMessage}
          </RNText>
        </View>
      )}
    </React.Fragment>
  );
};

interface HelpScreenProps {
  source: 'Inji' | 'BackUp';
  triggerComponent: React.ReactElement;
}

export default HelpScreen;
