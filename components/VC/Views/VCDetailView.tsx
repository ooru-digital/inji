import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  ImageBackground,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  VerifiableCredential,
  WalletBindingResponse,
} from '../../../machines/VerifiableCredential/VCMetaMachine/vc';
import {Button, Column, Row, Text} from '../../ui';
import {Theme} from '../../ui/styleUtils';
import {QrCodeOverlay} from '../../QrCodeOverlay';
import {SvgImage} from '../../ui/svg';
import {
  getDetailedViewFields,
  isActivationNeeded,
} from '../../../shared/openId4VCI/Utils';
import {
  BOTTOM_SECTION_FIELDS_WITH_DETAILED_ADDRESS_FIELDS,
  DETAIL_VIEW_BOTTOM_SECTION_FIELDS,
  DETAIL_VIEW_DEFAULT_FIELDS,
  fieldItemIterator,
  isVCLoaded,
  setBackgroundColour,
} from '../common/VCUtils';
import {setTextColor} from '../common/VCItemField';
import {ActivityIndicator} from '../../ui/ActivityIndicator';
import {ProfileIcon} from '../../ProfileIcon';
import {WebView} from 'react-native-webview';

const getProfileImage = (face: any) => {
  if (face) {
    return (
      <Image source={{uri: face}} style={Theme.Styles.detailedViewImage} />
    );
  }
  return (
    <ProfileIcon
      profileIconContainerStyles={Theme.Styles.openCardProfileIconContainer}
      profileIconSize={40}
    />
  );
};

export const VCDetailView: React.FC<VCItemDetailsProps> = props => {
  const {t, i18n} = useTranslation('VcDetails');
  const logo = props.verifiableCredentialData.issuerLogo;
  const publicUrl = props.credential?.credentialSubject['public_verify_url'];
  const face = props.verifiableCredentialData.face;
  const verifiableCredential = props.credential;
  const [fields, setFields] = useState([]);
  const [wellknown, setWellknown] = useState(null);
  const [showWebView, setShowWebView] = useState(false); // State to toggle WebView

  useEffect(() => {
    getDetailedViewFields(
      props.verifiableCredentialData?.issuer,
      props.verifiableCredentialData?.wellKnown,
      props.verifiableCredentialData?.credentialTypes,
      DETAIL_VIEW_DEFAULT_FIELDS,
    ).then(response => {
      setWellknown(response.wellknown);
      setFields(response.fields);
    });
  }, [props.verifiableCredentialData?.wellKnown]);

  const viewIcon = require('../../../assets/share.png');

  const shouldShowHrLine = verifiableCredential => {
    const availableFieldNames = Object.keys(
      verifiableCredential?.credentialSubject,
    );

    for (const fieldName of availableFieldNames) {
      if (
        BOTTOM_SECTION_FIELDS_WITH_DETAILED_ADDRESS_FIELDS.includes(fieldName)
      ) {
        return true;
      }
    }

    return false;
  };

  if (!isVCLoaded(verifiableCredential, fields)) {
    return <ActivityIndicator />;
  }

  const handleOpenWebView = () => {
    setShowWebView(true); // Show the WebView when the button is clicked
  };

  const handleCloseWebView = () => {
    setShowWebView(false); // Close the WebView
  };

  if (showWebView) {
    return (
      <View style={styles.webViewContainer}>
        <TouchableOpacity
          onPress={handleCloseWebView}
          style={styles.closeButton}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        <WebView
          source={{uri: publicUrl}} // Replace with your desired URL
          style={styles.webView}
        />
      </View>
    );
  }

  return (
    <>
      <Column scroll>
        <Column fill>
          <Column
            padding="10 10 3 10"
            backgroundColor={Theme.Colors.DetailedViewBackground}>
            <ImageBackground
              imageStyle={{width: '100%'}}
              resizeMethod="scale"
              resizeMode="stretch"
              style={[
                Theme.Styles.openCardBgContainer,
                setBackgroundColour(wellknown),
              ]}
              source={Theme.OpenCard}>
              <Row padding="14 14 0 14" margin="0 0 0 0">
                <Column crossAlign="center">
                  {getProfileImage(face)}
                  <QrCodeOverlay
                    verifiableCredential={verifiableCredential}
                    meta={props.verifiableCredentialData.vcMetadata}
                  />
                  <Column
                    width={80}
                    height={59}
                    crossAlign="center"
                    margin="12 0 0 0">
                    <Image
                      source={{uri: logo?.url}}
                      style={Theme.Styles.issuerLogo}
                      resizeMethod="scale"
                      resizeMode="contain"
                    />
                  </Column>
                </Column>
                <Column
                  align="space-evenly"
                  margin={'0 0 0 24'}
                  style={{flex: 1}}>
                  {fieldItemIterator(
                    fields,
                    verifiableCredential,
                    wellknown,
                    props,
                  )}
                </Column>
              </Row>
              {shouldShowHrLine(verifiableCredential) && (
                <>
                  <View
                    style={[
                      Theme.Styles.hrLine,
                      {
                        borderBottomColor: setTextColor(wellknown, 'hrLine')
                          ?.color,
                      },
                    ]}></View>
                  <Column padding="0 14 14 14">
                    {fieldItemIterator(
                      DETAIL_VIEW_BOTTOM_SECTION_FIELDS,
                      verifiableCredential,
                      wellknown,
                      props,
                    )}
                  </Column>
                </>
              )}
            </ImageBackground>
          </Column>
        </Column>
        {props.vcHasImage && (
          <View
            style={{
              position: 'relative',
              backgroundColor: Theme.Colors.DetailedViewBackground,
              justifyContent: 'center', // Vertically center
              alignItems: 'center', // Horizontally center
              flex: 1, // Make the view take the full available space
            }}>
            {/* "View Certificate Online" text */}
            <Text
              style={{
                fontSize: 16, // Adjust the font size as needed
                fontWeight: 'bold', // Adjust font weight
                marginBottom: 10, // Add space between the text and image
                color: Theme.Colors.textColor, // You can replace with your desired color
              }}>
              View Certificate Online
            </Text>

            {/* TouchableOpacity containing the image */}
            <TouchableOpacity onPress={handleOpenWebView}>
              <Image
                source={viewIcon}
                style={{
                  width: 60,
                  height: 60,
                  paddingVertical: 15,
                  paddingHorizontal: 10,
                  resizeMode: 'contain',
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      </Column>
    </>
  );
};

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'black',
    borderRadius: 20,
    padding: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export interface VCItemDetailsProps {
  credential: VerifiableCredential | Credential;
  verifiableCredentialData: any;
  walletBindingResponse: WalletBindingResponse;
  onBinding?: () => void;
  activeTab?: number;
  vcHasImage: boolean;
}
