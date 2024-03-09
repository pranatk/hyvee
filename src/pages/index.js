import { useState, useEffect } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [countryList, setCountryList] = useState([]);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(null);
  const [spinner, setSpinner] = useState(false);
  const [disabled, setDisabled] = useState(false);
  console.log("envv", process.env.NEXT_PUBLIC_API_KEY);
  const reset = () => {
    setNameError("");
    setGender(null);
    setCountryList([]);
    setAge(null);
    setDisabled(false);
  };
  const handleChange = (e) => {
    reset();
    setName(e.target.value);
    if (/^\s.*/.test(e.target.value)) {
      setNameError("Name should not start with a space");
      setDisabled(true);
    } else if (/\d/.test(e.target.value)) {
      setNameError("Name should not contain digits");
      setDisabled(true);
    }
    setSpinner(false);
  };
  const onSubmit = (e) => {
    setSpinner(true);
    e.preventDefault();
    if (!name) {
      setNameError("Name is required");
      return;
    }
    const agePromise = new Promise((resolve, reject) => {
      try {
        fetch(
          `https://api.agify.io?name=${name}&apiKey=${process.env.NEXT_PUBLIC_API_KEY}`
        )
          .then((res) => res.json())
          .then((data) => resolve(data));
      } catch {
        reject("There was an error while predicting Age.");
      }
    });
    const genderPromise = new Promise((resolve, reject) => {
      try {
        fetch(
          `https://api.genderize.io?name=${name}&apiKey=${process.env.NEXT_PUBLIC_API_KEY}`
        )
          .then((res) => res.json())
          .then((data) => resolve(data));
      } catch {
        reject("There was an error while predicting Gender.");
      }
    });
    const nationPromise = new Promise((resolve, reject) => {
      try {
        fetch(
          `https://api.nationalize.io?name=${name}&apiKey=${process.env.NEXT_PUBLIC_API_KEY}`
        )
          .then((res) => res.json())
          .then((data) => {
            let whereStr = "where=";
            data.country.forEach((c, i) => {
              whereStr += "iso2_code=" + `"${c.country_id}"`;
              if (i !== data.country.length - 1) {
                whereStr += " or ";
              }
            });
            let s = [];
            fetch(
              "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/countries-codes/records?" +
                whereStr
            )
              .then((res) => res.json())
              .then((d) => {
                try {
                  s = d.results.map((c) => ({
                    name: c.label_en.includes(",")
                      ? c.label_en.split(",")[0]
                      : c.label_en,
                    code: c.iso2_code,
                  }));

                  s = s.reduce((acc, curr) => {
                    const con = data.country.find(
                      (c) => c.country_id === curr.code
                    );
                    return acc?.length > 0
                      ? [...acc, { ...curr, probability: con?.probability }]
                      : [{ ...curr, probability: con?.probability }];
                  }, []);
                  resolve(s);
                } catch {
                  reject("Error while getting countries");
                }
              });
          });
      } catch {
        reject("There was an error while predicting Nation.");
      }
    });
    Promise.all([agePromise, genderPromise, nationPromise]).then((values) => {
      setSpinner(false);

      setAge(values[0]?.age);
      setGender({
        gender: values[1].gender,
        probability: values[1].probability,
      });
      setCountryList(values[2]);
    });
    // setGender({ gender: "Male", probability: 0.99 });
    // setAge(27);
    // setCountryList([{ code: "IN", name: "India", probability: 1 }]);
  };
  return (
    <div className={`flex text-white  w-screen `}>
      <div
        className={` h-screen gap-4 flex flex-col transition ease-in-out duration-200 ${
          !age ? "w-full" : "w-1/2 "
        } bg-[#151D29]  pt-40 px-32 `}
        style={{ transition: "width 0.3s ease-in-out" }}
      >
        <div className="flex flex-col gap-4">
          <h1 className=" text-5xl font-extrabold">NameNalysis</h1>
          <p>Analyse your name with a click of a button</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col pt-32">
          <input
            type="text"
            name="name"
            value={name}
            onChange={handleChange}
            className="w-full border border-transparent rounded-md p-2 text-[#151D29]"
            placeholder="Enter Name"
          />
          {nameError && (
            <p className="text-red-500 text-sm mt-2">{nameError}</p>
          )}
          <button
            disabled={disabled}
            type="submit"
            className="bg-white w-full mt-8  p-2 rounded-md text-[#151D29] font-semibold"
          >
            Search
          </button>
        </form>
      </div>
      {age && gender && countryList?.length > 0 && (
        <div className="w-1/2 text-[#151D29] pt-40 px-20">
          <div className="font-semibold text-3xl mb-8">
            Name Analysis for {name[0].toUpperCase() + name.slice(1)}
          </div>
          <div className="text-2xl font-semibold my-8">
            Age & Gender Details
          </div>
          <table className="border border-[#151D29] rounded-md w-full text-center mt-4">
            <tr className="p-2 border-b-[1px] border-[#151D29] last:border-b-0">
              <th className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0"></th>
              <th className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0"></th>
              <th className="p-2   border-r-[1px] border-[#151D29]">
                Probability
              </th>
            </tr>
            <tr className="p-2 border-b-[1px] border-[#151D29] last:border-b-0">
              <td className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0">
                Age
              </td>
              <td className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0">
                {age}
              </td>
              <td className="p-2   border-r-[1px] border-[#151D29]">100%</td>
            </tr>

            <tr className="p-2 border-b-[1px] border-[#151D29] last:border-b-0">
              <td className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0">
                Gender
              </td>
              <td className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0">
                {gender.gender}
              </td>
              <td className="p-2   border-r-[1px] border-[#151D29]">
                {gender.probability * 100}%
              </td>
            </tr>
          </table>
          <div className="text-2xl font-semibold my-8">Country Details</div>
          <table className="border border-[#151D29]  w-full text-center mt-4">
            <tr className="p-2 border-b-[1px] border-[#151D29] last:border-b-0">
              <th className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0">
                Country
              </th>
              <th className="p-2   border-r-[1px] border-[#151D29]">
                Probability
              </th>
            </tr>
            {countryList.map((country, i) => {
              return (
                <tr
                  key={i}
                  className="p-2 border-b-[1px] border-[#151D29] last:border-b-0"
                >
                  <td className="p-2  border-r-[1px] border-[#151D29] last:boder-r-0">
                    {country.name}
                  </td>

                  <td className="p-2   border-r-[1px] border-[#151D29]">
                    {country.probability * 100}%
                  </td>
                </tr>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}
