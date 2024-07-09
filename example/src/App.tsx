import Wallet, { type Address, AddressPurpose, BitcoinNetworkType } from 'sats-connect';
import {
  AddressDisplay,
  EtchRunes,
  MintRunes,
  NetworkSelector,
  SendBtc,
  SendStx,
} from './components';
import { useLocalStorage } from './hooks';
import { useCallback } from 'react';
import GetBtcBalance from './components/GetBtcBalance';
import GetRunesBalance from './components/GetRunesBalance';
import { Container, ConnectButtonsContainer, Header, Logo, Body, Button } from './App.styles';
import GetInscriptions from './components/GetInscriptions';

function App() {
  const [network, setNetwork] = useLocalStorage<BitcoinNetworkType>(
    'network',
    BitcoinNetworkType.Mainnet
  );
  const [btcAddressInfo, setBtcAddressInfo] = useLocalStorage<Address[]>('btc-addresses', []);
  const [stxAddressInfo, setStxAddressInfo] = useLocalStorage<Address[]>('stx-addresses', []);
  const [legacyAddressInfo, setLegacyAddressInfo] = useLocalStorage<Address[]>(
    'legacy-addresses',
    []
  );

  const isConnected = btcAddressInfo.length + stxAddressInfo.length + legacyAddressInfo.length > 0;

  const onConnectLegacy = useCallback(() => {
    (async () => {
      const response = await Wallet.request('getAccounts', {
        purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals, AddressPurpose.Stacks],
        message: 'Cool app wants to know your addresses!',
      });
      if (response.status === 'success') {
        setLegacyAddressInfo(response.result);
      }
    })().catch(console.error);
  }, [setLegacyAddressInfo]);

  const onConnect = useCallback(() => {
    (async () => {
      const res = await Wallet.request('wallet_requestPermissions', undefined);
      if (res.status === 'error') {
        console.error('Error connecting to wallet, details in terminal.');
        console.error(res);
        return;
      }

      const res2 = await Wallet.request('getAddresses', {
        purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
      });

      if (res2.status === 'error') {
        console.error('Error retrieving bitcoin addresses after having requested permissions.');
        console.error(res2);
        return;
      }

      setBtcAddressInfo(res2.result.addresses);
      const res3 = await Wallet.request('stx_getAddresses', null);

      if (res3.status === 'error') {
        alert(
          'Error retrieving stacks addresses after having requested permissions. Details in terminal.'
        );
        console.error(res3);
        return;
      }

      setStxAddressInfo(res3.result.addresses);
    })().catch(console.error);
  }, [setBtcAddressInfo, setStxAddressInfo]);

  const onDisconnect = useCallback(() => {
    (async () => {
      await Wallet.disconnect();
      setBtcAddressInfo([]);
      setStxAddressInfo([]);
      setLegacyAddressInfo([]);
    })().catch(console.error);
  }, [setBtcAddressInfo, setLegacyAddressInfo, setStxAddressInfo]);

  if (!isConnected) {
    return (
      <Container>
        <Header>
          <Logo src="/sats-connect.svg" alt="SatsConnect" />
          <NetworkSelector network={network} setNetwork={setNetwork} />
          <p>Click the button to connect your wallet</p>
          <ConnectButtonsContainer>
            <Button onClick={onConnect}>Connect</Button>
            <Button onClick={onConnectLegacy}>Connect (Legacy)</Button>
          </ConnectButtonsContainer>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Body>
        <div>
          <Logo src="/sats-connect.svg" alt="SatsConnect" />
        </div>
        <AddressDisplay
          network={network}
          addresses={[...btcAddressInfo, ...stxAddressInfo]}
          onDisconnect={onDisconnect}
        />
        <SendStx network={network} />
        <SendBtc network={network} />
        <GetBtcBalance />
        <MintRunes network={network} addresses={[...btcAddressInfo, ...legacyAddressInfo]} />
        <EtchRunes network={network} addresses={[...btcAddressInfo, ...legacyAddressInfo]} />
        <GetRunesBalance />
        <GetInscriptions />
      </Body>
    </Container>
  );
}

export default App;
