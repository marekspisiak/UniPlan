import Header from "../components/Header/Header";
import MobileNav from "../components/MobileNav/MobileNav";

const MobileLayout = ({ children }) => {
  return (
    <div style={{ paddingTop: "56px", paddingBottom: "60px" }}>
      <Header />
      <main>{children}</main>
      <MobileNav />
    </div>
  );
};

export default MobileLayout;
