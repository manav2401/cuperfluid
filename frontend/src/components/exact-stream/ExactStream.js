import { Web3Provider } from "@ethersproject/providers";
import SuperfluidSDK from "@superfluid-finance/js-sdk";
import { Biconomy } from "@biconomy/mexa";
import { useState } from "react";

const SuperfluidArtifact = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid.json");
const CfaArtifact = require("@superfluid-finance/ethereum-contracts/build/contracts/IConstantFlowAgreementV1.json");

export default function ExactStream({ address, token }) {
  const [recipient, setRecipient] = useState("");
  const [flowRate, setFlowRate] = useState("");
  const [endDate, setEndDate] = useState(null);

  const createExactStream = async () => {
    if (recipient && flowRate && endDate) {
      const provider = new Web3Provider(window.ethereum);

      const sf = new SuperfluidSDK.Framework({
        ethers: provider,
      });
      await sf.initialize();
      const user = sf.user({ address, token });
      await user.flow({ recipient, flowRate });

      // create meta transaction for end stream
      const apiKey = process.env.REACT_APP_BICONOMY_API_KEY;
      const biconomy = new Biconomy(provider, { apiKey: apiKey, debug: true });
      biconomy
        .onEvent(biconomy.READY, async () => {
          try {
            console.log("IN BICONOMY READY EVENT");
            // axios call...
          } catch (error) {
            console.log("Error in biconomy execution:", error);
          }
        })
        .onEvent(biconomy.ERROR, (error, message) => {
          console.log("IN BICONOMY ERROR EVENT");
        });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Create New Exact Stream</h3>
      </div>
      <div className="card-content">
        <p style={{ padding: 5 }}>Recipient Address: </p>
        <input
          onChange={(e) => setRecipient(e.target.value)}
          value={recipient}
        />
        <p style={{ padding: 5 }}>Flow Rate: </p>
        <div style={{ display: "flex" }}>
          <input
            onChange={(e) => setFlowRate(e.target.value)}
            value={flowRate}
          />
          <p style={{ marginLeft: 4 }}>per second</p>
        </div>
        <p style={{ padding: 5 }}>End Date (timestamp):</p>
        <input onChange={(e) => setEndDate(e.target.value)} value={endDate} />
        <button onClick={createExactStream} style={{ marginTop: 8 }}>
          Sumbit
        </button>
      </div>
    </div>
  );
}
