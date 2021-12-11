import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import SuperfluidSDK from "@superfluid-finance/js-sdk";
import { Web3Provider } from "@ethersproject/providers";
import Details from "./components/Details";
import ExactStream from "./components/exact-stream/ExactStream";

function App() {
  const windowWeb3 = window;
  const [address, setAddress] = useState("");
  const [user, setUser] = useState();
  const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f";

  const getDetails = useCallback(async () => {
    const sf = new SuperfluidSDK.Framework({
      ethers: new Web3Provider(windowWeb3.ethereum),
    });
    await sf.initialize();
    const user = sf.user({
      address,
      token: fDAIx,
    });
    setUser(user);
  }, [address, windowWeb3.ethereum]);

  useEffect(() => {
    if (address !== "") {
      getDetails();
    }
  }, [address, getDetails]);

  const handleWallet = async () => {
    const walletAddr = await windowWeb3.ethereum.request({
      method: "eth_requestAccounts",
      params: [{ eth_accounts: {} }],
    });
    setAddress(walletAddr[0]);
  };

  return (
    <main>
      <Navbar />
      <div className="content">
        {user !== undefined ? (
          <>
            <Details address={address} token={"fDAIx"} />
            <ExactStream address={address} token={fDAIx} />
          </>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3>Connect Wallet</h3>
            </div>
            <div className="card-content">
              <button onClick={handleWallet}>Metamask</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
