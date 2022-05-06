import './styles/App.css';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import myEpicNft from './utils/MyEpicNFT.json';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { UAuthConnector } from '@uauth/web3-react';
import UAuth from '@uauth/js';
import { useWeb3React } from '@web3-react/core';

// I moved the contract address to the top for easy access.
const CONTRACT_ADDRESS = '0xCAd466b31689853e5a65BFEf2d4B4DbAF93ec327';
const OPENSEA_LINK = `https://testnets.opensea.io/${CONTRACT_ADDRESS}`;

const injectedConnector = new InjectedConnector({
  supportedChainIds: [4],
});

const walletconnectConnector = new WalletConnectConnector({
  infuraId: process.env.REACT_APP_INFURA_ID,
  supportedChainIds: [4],
  qrcode: true,
});

const uauthConnector = new UAuthConnector({
  uauth: new UAuth({
    clientID: process.env.REACT_APP_CLIENT_ID,
    redirectUri: 'http://localhost:3000',
    scope: 'openid wallet',
  }),
  connectors: {
    injected: injectedConnector,
    walletconnect: walletconnectConnector,
  },
});

function withUseWeb3React(Component) {
  return function WrappedComponent(props) {
    const values = useWeb3React();
    return <Component {...props} web3ReactHookValue={values} />;
  };
}

const App = (props) => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const uLogin = async () => {
    props.web3ReactHookValue
      .activate(uauthConnector, undefined, true)
      .then(async (r) => {
        let user = await uauthConnector.uauth.user();
        uauthConnector
          .getAccount()
          .then((account) => {
            setCurrentAccount(user.sub);
            setIsConnected(true);
            window.ethereum.on('chainChanged', () => {
              window.location.reload();
            });
          })
          .catch((e) => {
            console.error(e);
          });
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const connectWallet = async () => {
    props.web3ReactHookValue
      .activate(injectedConnector, undefined, true)
      .then((r) => {
        injectedConnector
          .getAccount()
          .then((account) => {
            setIsConnected(true);
            window.ethereum.on('chainChanged', () => {
              window.location.reload();
            });
          })
          .catch((e) => {
            console.error(e);
          });
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log('Going to pop wallet now to pay gas...');
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log('Mining...please wait.');
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        alert(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderNotConnectedContainer = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: 'auto',
        width: 'fit-content',
      }}
    >
      <button
        onClick={connectWallet}
        className="login-btn cta-button connect-wallet-button"
      >
        Connect to Wallet
      </button>
      <button
        onClick={uLogin}
        className="login-btn cta-button connect-wallet-button"
      >
        Login with unstoppable
      </button>
    </div>
  );

  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button connect-wallet-button"
    >
      Mint NFT
    </button>
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          {isConnected && <p className="sub-text">{currentAccount}</p>}
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {!isConnected ? renderNotConnectedContainer() : renderMintUI()}
          <div className="container-link">
            <button
              onClick={(e) => {
                e.preventDefault();
                const newWindow = window.open(
                  OPENSEA_LINK,
                  '_blank',
                  'noopener,noreferrer'
                );
                if (newWindow) newWindow.opener = null;
              }}
              className="cta-button connect-wallet-button"
            >
              🌊 View Collection on OpenSea
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withUseWeb3React(App);
