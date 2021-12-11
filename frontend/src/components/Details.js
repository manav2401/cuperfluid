import arrow from "../assets/arrow.svg";
import Decimal from "decimal.js";

export default function Details(props) {
  const { address, token } = props;

  const getFlowRate = (numeric) => {
    return new Decimal(numeric).dividedBy(1e18).toString();
  };

  const getShortAddress = (address) => {
    const start = address.substring(0, 5);
    const end = address.substring(address.length - 5, address.length);
    return `${start}..${end}`;
  };

  return (
    <div className="details">
      <div className="card-header">
        <h3>Superfluid User Details</h3>
      </div>
      <div className="card-content">
        <p>
          Address:
          <span className="highlight">{address}</span>
        </p>
        <p>
          Supertoken:
          <span className="highlight">{token}</span>
        </p>
      </div>
    </div>
  );
}
