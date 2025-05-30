import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../userContext";
import { API_BASE } from "../components/api";

function LoginPage() {
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [redirect, setRedirect] = useState(false)
  const {setUserInfo} = useContext(UserContext)

  const [warningDisplay, setWarningDisplay] = useState(false)
  
  useEffect(()=>{
    setWarningDisplay(false)
  }, [username,password])

  function ResetLogin(){
    setUsername('')
    setPassword('')
  }

  async function Login(e:any) {
    e.preventDefault();

    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

        if (!response.ok) {
          if (username === '' && password === '') {
            setWarningDisplay(true);
    return;
    }
          setWarningDisplay(true)
    } else {
      response.json().then(userInfo => {
        setUserInfo(userInfo)
        setRedirect(true)
      })
      ResetLogin();
    }

  }

  if(redirect){
    return <Navigate to={'/'}/>
  }

  return (
<main className="max-w-screen-xl mx-auto">
    <form className="flex flex-col gap-4 max-w-sm mx-auto mt-10"
          onSubmit={Login}>
          <h1 className="font-bold text-3xl hover:underline mx-auto">Login</h1>

    <input type="text"
           placeholder="Username"
           className="p-2 border rounded"
           value={username}
           onChange={((e)=> setUsername(e.target.value))}
       />

    <input type="password"
           placeholder="Password"
           className="p-2 border rounded" 
           value={password}
           onChange={((e)=> setPassword(e.target.value))}
      />

    <button className="p-2 bg-black transition-all cursor-pointer hover:rounded-xl text-white rounded hover:bg-gray-800">
      Login
    </button>
    </form>
        {warningDisplay && (
      <div className="text-center text-red-600 m-2">
        {username === '' && password === '' ? (
          <h1>Please enter your login information</h1>
        ) : (
          <h1>Invalid username and/or password</h1>
        )}
      </div>
)}

</main>

  )
}

export default LoginPage
