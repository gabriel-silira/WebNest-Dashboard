export default function Avatar() {
  return (
    <img
      className="avatar avatar--logo"
      src={`${import.meta.env.BASE_URL}WebNest_Logo.png`}
      alt="Logo da WebNest"
    />
  );
}
