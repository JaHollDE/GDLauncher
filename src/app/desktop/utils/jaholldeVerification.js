import { getURL } from "../../../common/store/jahollConfig";
import axios from "axios";
import { MINECRAFT_SERVICES_URL } from "../../../common/utils/constants";

let c;
export function onAccountChange(callback) {
  c = callback;
}
export function accountChange() {
  c?.();
}

export async function verifyToken(mcToken) {
  const url = await getURL();

  const request = `${url}/api/user/verify`;

  const data = await axios.get(request, {
    headers: {
      Authorization: `Bearer ${mcToken}`
    }
  });

  return data.data;
}