import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000";
const cache = {};

export const getNickname = async (address) => {
  if (!address) return "Unknown";
  if (cache[address]) return cache[address];
  try {
    const res = await axios.get(`${API_URL}/api/users/${address.toLowerCase()}`);
    const name = res.data.exists
      ? res.data.user.nickname
      : address.slice(0, 6) + "..." + address.slice(-4);
    cache[address] = name;
    return name;
  } catch {
    return address.slice(0, 6) + "..." + address.slice(-4);
  }
};

export const useNickname = (address) => {
  const [nickname, setNickname] = useState("Loading...");

  useEffect(() => {
    if (address) {
      getNickname(address).then(setNickname);
    }
  }, [address]);

  return nickname;
};