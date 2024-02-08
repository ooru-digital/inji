import React from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable} from 'react-native';
import {Icon, ListItem} from 'react-native-elements';
import {Row, Text} from '../../components/ui';
import {Error} from '../../components/ui/Error';
import {Loader} from '../../components/ui/Loader';
import {Theme} from '../../components/ui/styleUtils';
import {SvgImage} from '../../components/ui/svg';
import {AccountSelectionConfirmation} from '../backupAndRestore/AccountSelectionConfirmation';
import {useBackupAndRestoreSetup} from '../backupAndRestore/BackupAndRestoreSetupController';
import BackupAndRestoreScreen from '../backupAndRestore/BackupAndRestoreScreen';
import testIDProps from '../../shared/commonUtil';

export const DataBackupAndRestore: React.FC = ({} = () => {
  const controller = useBackupAndRestoreSetup();
  const {t} = useTranslation('DataBackupScreen');

  return (
    <React.Fragment>
      <Pressable onPress={controller.BACKUP_AND_RESTORE}>
        <ListItem topDivider bottomDivider>
          {SvgImage.DataBackupIcon(25, 25)}
          <ListItem.Content>
            <ListItem.Title style={{paddingTop: 3}}>
              <Row>
                <Text
                  testID="dataBackupAndRestore"
                  weight="semibold"
                  color={Theme.Colors.settingsLabel}
                  style={{paddingRight: 10}}>
                  {t('dataBackupAndRestore')}
                </Text>
                {!controller.isBackupAndRestoreExplored && (
                  <Text
                    testID="newLabel"
                    style={Theme.Styles.newLabel}
                    color={Theme.Colors.whiteText}>
                    {t('new')}
                  </Text>
                )}
              </Row>
            </ListItem.Title>
          </ListItem.Content>
          <Icon
            name="chevron-right"
            size={21}
            {...testIDProps('rightArrowIcon')}
            color={Theme.Colors.chevronRightColor}
            style={{marginRight: 15}}
          />
        </ListItem>
      </Pressable>

      {controller.isSigningInFailed && (
        <Error
          isModal
          alignActionsOnEnd
          showClose={false}
          isVisible={controller.isSigningInFailed}
          title={t('errors.permissionDenied.title')}
          message={t('errors.permissionDenied.message')}
          helpText={t('errors.permissionDenied.helpText')}
          image={SvgImage.PermissionDenied()}
          primaryButtonText={
            'DataBackupScreen:errors.permissionDenied.actions.allowAccess'
          }
          primaryButtonEvent={controller.TRY_AGAIN}
          textButtonText={
            'DataBackupScreen:errors.permissionDenied.actions.notNow'
          }
          textButtonEvent={controller.GO_BACK}
          onDismiss={controller.GO_BACK}
          primaryButtonTestID="allowAccess"
          textButtonTestID="notNow"
          customImageStyles={{paddingBottom: 0, marginBottom: -6}}
          customStyles={{marginTop: '20%'}}
          testID="CloudBackupConsentDenied"
        />
      )}

      {controller.isNetworkOff && (
        <Error
          testID="networkOffError"
          primaryButtonTestID="tryAgain"
          primaryButtonText="tryAgain"
          primaryButtonEvent={controller.TRY_AGAIN}
          isVisible={controller.isNetworkOff}
          isModal={true}
          showClose
          title={t('errors.noInternetConnection.title')}
          message={t('errors.noInternetConnection.message')}
          onDismiss={controller.DISMISS}
          image={SvgImage.NoInternetConnection()}
        />
      )}

      {(controller.isSigningIn || controller.isSigningInSuccessful) && (
        <BackupAndRestoreScreen
          profileInfo={controller.profileInfo}
          onBackPress={controller.GO_BACK}
          isLoading={controller.isSigningIn}
        />
      )}
      {controller.isLoading && (
        <Loader title={t('loadingSubtitle')} isModal></Loader>
      )}

      {controller.showAccountSelectionConfirmation && (
        <AccountSelectionConfirmation
          isVisible={controller.showAccountSelectionConfirmation}
          onProceed={controller.PROCEED_ACCOUNT_SELECTION}
          goBack={controller.GO_BACK}
        />
      )}
    </React.Fragment>
  );
});