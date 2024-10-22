import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Image, ImageBackground, View, TouchableOpacity} from 'react-native';
import {WebView} from 'react-native-webview';
import {
  VerifiableCredential,
  WalletBindingResponse,
} from '../../../machines/VerifiableCredential/VCMetaMachine/vc';
import {Button, Column, Row, Text} from '../../ui';
import {Theme} from '../../ui/styleUtils';
import {QrCodeOverlay} from '../../QrCodeOverlay';
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
import {SvgXml} from 'react-native-svg'; // Added SvgXml for rendering SVGs

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

// Helper function to render SVG or PNG image based on the data
const renderLogoImage = logo => {
  if (!logo) return null;

  if (logo.startsWith('data:image/svg+xml;base64,')) {
    const base64Svg = logo.replace('data:image/svg+xml;base64,', '');
    return <SvgXml xml={atob(base64Svg)} width="80" height="80" />;
  } else if (logo.startsWith('data:image/png;base64,')) {
    return (
      <Image
        source={{uri: logo}}
        style={{width: 80, height: 80}}
        resizeMethod="scale"
        resizeMode="contain"
      />
    );
  }
  return null;
};

export const VCDetailView: React.FC<VCItemDetailsProps> = props => {
  const {t, i18n} = useTranslation('VcDetails');
  const logo = props.credential?.credentialSubject['issuer_logo'];
  const face = props.verifiableCredentialData.face;
  const publicUrl = props.credential?.credentialSubject['public_verify_url'];
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

  const viewIcon = require('../../../assets/View-Icon.jpg');
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

  // Function to handle opening the WebView
  const handleOpenWebView = () => {
    setShowWebView(true); // Show the WebView when the button is clicked
  };

  return (
    <>
      {showWebView ? (
        <WebView source={{uri: publicUrl}} style={{flex: 1}} />
      ) : (
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
                    {/* <QrCodeOverlay
                      verifiableCredential={verifiableCredential}
                      meta={props.verifiableCredentialData.vcMetadata}
                    /> */}
                    <Column
                      width={80}
                      height={59}
                      crossAlign="center"
                      margin="12 0 0 0">
                      {renderLogoImage(logo)}
                    </Column>
                  </Column>

                  <Column
                    align="space-evenly"
                    margin={'0 0 0 14'}
                    style={{flex: 1}}>
                    {fieldItemIterator(
                      fields,
                      verifiableCredential,
                      wellknown,
                      props,
                    )}
                  </Column>
                  <Column
                    width={20}
                    height={10}
                    crossAlign="center"
                    margin="50 0 0 0"
                    style={{ flex: 1 }}>
                    <TouchableOpacity onPress={handleOpenWebView}>
                      {/* Use Image for PNG icons */}
                      <Image
                        source={viewIcon}
                        style={{
                          width: 80,
                          height: 80,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                        }}
                      />
                      {/* Alternatively, use SvgXml for SVG icons */}
                      {/* <SvgXml xml={yourSvgXmlData} width="80" height="80" /> */}
                    </TouchableOpacity>
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
                      ]}
                    />
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
        </Column>
      )}
    </>
  );
};

export interface VCItemDetailsProps {
  credential: VerifiableCredential | Credential;
  verifiableCredentialData: any;
  walletBindingResponse: WalletBindingResponse;
  onBinding?: () => void;
  activeTab?: number;
  vcHasImage: boolean;
}
