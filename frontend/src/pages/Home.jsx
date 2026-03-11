import Sidebar from "../components/Sidebar";

const Home = () => {
  return (
    <div className="flex">

      <Sidebar />

      <div className="ml-64 p-8 w-full">

        <h1 className="text-3xl font-bold">
          EduAitor Super Admin Dashboard
        </h1>

      </div>

    </div>
  );
};

export default Home;