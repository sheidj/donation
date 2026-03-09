import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AlumniDonationModule = buildModule("AlumniDonationModule", (m) => {
  const alumniDonation = m.contract("contracts/AlumniDonation.sol:AlumniDonation", []);

  return { alumniDonation };
});

export default AlumniDonationModule;
