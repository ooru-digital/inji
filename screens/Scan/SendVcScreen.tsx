import React, {useContext, useEffect, useRef, useState} from 'react';
import {NativeModules, BackHandler} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Button, Column, Text} from '../../components/ui';
import {Theme} from '../../components/ui/styleUtils';
import {useSendVcScreen} from './SendVcScreenController';
import {VerifyIdentityOverlay} from '../VerifyIdentityOverlay';
import {useInterpret} from '@xstate/react';
import {GlobalContext} from '../../shared/GlobalContext';
import {useFocusEffect} from '@react-navigation/native';
import {VcItemContainer} from '../../components/VC/VcItemContainer';
import {VCMetadata} from '../../shared/VCMetadata';
import {createVCItemMachine} from '../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';
import {
  getImpressionEventData,
  sendImpressionEvent,
} from '../../shared/telemetry/TelemetryUtils';
import {TelemetryConstants} from '../../shared/telemetry/TelemetryConstants';
import {
  getVCsOrderedByPinStatus,
  VCItemContainerFlowType,
} from '../../shared/Utils';
import {Issuers} from '../../shared/openId4VCI/Utils';
import {FaceVerificationAlertOverlay} from './FaceVerificationAlertOverlay';
import {Error} from '../../components/ui/Error';
import {SvgImage} from '../../components/ui/svg';

const {TrustFingerReactNativeModule} = NativeModules;

export const SendVcScreen: React.FC = () => {
  const {t} = useTranslation('SendVcScreen');
  const {appService} = useContext(GlobalContext);
  const controller = useSendVcScreen();
  const [base64FeatureData, setBase64FeatureData] = useState<string | null>(
    null,
  );

  let shareableVcsMetadataOrderedByPinStatus = getVCsOrderedByPinStatus(
    controller.shareableVcsMetadata,
  );
  let service;

  if (shareableVcsMetadataOrderedByPinStatus?.length > 0) {
    shareableVcsMetadataOrderedByPinStatus =
      shareableVcsMetadataOrderedByPinStatus.filter(
        item => item.credentialID === controller.setScanSearchID,
      );
    const vcMetadata = shareableVcsMetadataOrderedByPinStatus;
    const firstVCMachine = useRef(
      createVCItemMachine(
        appService.getSnapshot().context.serviceRefs,
        vcMetadata,
      ),
    );

    service = useInterpret(firstVCMachine.current);
  }

  useEffect(() => {
    if (service) {
      controller.SELECT_VC_ITEM(0)(service);
    }
  }, [service]);

  useEffect(() => {
    sendImpressionEvent(
      getImpressionEventData(
        TelemetryConstants.FlowType.senderVcShare,
        TelemetryConstants.Screens.vcList,
      ),
    );
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;

      const disableBackHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => disableBackHandler.remove();
    }, []),
  );

  const captureFingerprint = async () => {
    try {
      const capturedData =
        await TrustFingerReactNativeModule.captureBiometricData();
      console.log('Fingerprint data captured:', capturedData);
      setBase64FeatureData(capturedData);
    } catch (error) {
      console.error('Error capturing fingerprint data:', error);
    }
  };

  const verifyFingerprint = async (fingerprintData: string) => {
    if (!fingerprintData) {
      console.error('No fingerprint data to verify');
      return;
    }
    try {
      const result = await TrustFingerReactNativeModule.verifyBiometricData(
        fingerprintData,
      );
      console.log('Fingerprint verification result:', result);
      // Further processing based on verification result
    } catch (error) {
      console.error('Error verifying fingerprint data:', error);
    }
  };

  return (
    <React.Fragment>
      <Column fill backgroundColor={Theme.Colors.lightGreyBackgroundColor}>
        <Column>
          <Text
            margin="15 0 13 24"
            weight="bold"
            color={Theme.Colors.textValue}
            style={{position: 'relative'}}>
            {t('pleaseSelectAnId')}
          </Text>
        </Column>
        <Column scroll>
          {shareableVcsMetadataOrderedByPinStatus.map((vcMetadata, index) => (
            <VcItemContainer
              key={vcMetadata.getVcKey()}
              vcMetadata={vcMetadata}
              margin="0 2 8 2"
              onPress={controller.SELECT_VC_ITEM(index)}
              selectable
              selected={index === controller.selectedIndex}
              flow={VCItemContainerFlowType.VC_SHARE}
              isPinned={vcMetadata.isPinned}
            />
          ))}
        </Column>
        <Column
          style={Theme.SendVcScreenStyles.shareOptionButtonsContainer}
          backgroundColor={Theme.Colors.whiteBackgroundColor}>
          {([Issuers.Mosip, Issuers.ESignet].indexOf(
            controller.verifiableCredentialData.finger?.left_thumb,
          ) ||
            [Issuers.Mosip, Issuers.ESignet].indexOf(
              controller.verifiableCredentialData.finger?.right_thumb,
            )) === -1 && (
            <Button
              type="gradient"
              title={t('captureFingerPrint')}
              styles={{marginTop: 12}}
              onPress={captureFingerprint}
            />
          )}

          {[Issuers.Mosip, Issuers.ESignet].indexOf(
            controller.verifiableCredentialData.issuer,
          ) !== -1 && (
            <Button
              type="gradient"
              title={t('authWithFingerPrint')}
              styles={{marginTop: 12}}
              disabled={controller.selectedIndex == null}
              onPress={() =>
                verifyFingerprint(
                  controller.verifiableCredentialData?.finger?.right_thumb ||
                    base64FeatureData,
                )
              }
            />
          )}
          {console.log(
            'controller.verifiableCredentialData?.finger  >>>',
            controller.verifiableCredentialData,
          )}
          <Button
            type="gradient"
            styles={{marginTop: 12}}
            title={t('authWithFace')}
            disabled={controller.selectedIndex == null}
            onPress={controller.ACCEPT_REQUEST}
          />

          <Button
            type="clear"
            loading={controller.isCancelling}
            title={t('reject')}
            onPress={controller.CANCEL}
          />
        </Column>
      </Column>

      <VerifyIdentityOverlay
        credential={controller.credential}
        verifiableCredentialData={controller.verifiableCredentialData}
        isVerifyingIdentity={controller.isVerifyingIdentity}
        onCancel={controller.CANCEL}
        onFaceValid={controller.FACE_VALID}
        onFaceInvalid={controller.FACE_INVALID}
      />

      <FaceVerificationAlertOverlay
        isVisible={controller.isFaceVerificationConsent}
        onConfirm={controller.FACE_VERIFICATION_CONSENT}
        close={controller.DISMISS}
      />

      <Error
        isModal
        alignActionsOnEnd
        showClose={false}
        isVisible={controller.isInvalidIdentity}
        title={t('ScanScreen:postFaceCapture.captureFailureTitle')}
        message={t('ScanScreen:postFaceCapture.captureFailureMessage')}
        image={SvgImage.PermissionDenied()}
        primaryButtonTestID={'retry'}
        primaryButtonText={t('ScanScreen:status.retry')}
        primaryButtonEvent={controller.RETRY_VERIFICATION}
        textButtonTestID={'home'}
        textButtonText={t('ScanScreen:status.accepted.home')}
        textButtonEvent={controller.GO_TO_HOME}
        customImageStyles={{paddingBottom: 0, marginBottom: -6}}
        customStyles={{marginTop: '20%'}}
        testID={'shareWithSelfieError'}
      />
    </React.Fragment>
  );
};
