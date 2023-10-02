import { clean } from "./clean";

export const axios = {
  get: (url: string, config: any) => {
    return Promise.resolve(__wrap_subinvoke("plugin/axios", "get", clean({ url, config })).value);
  },
  post: (url: string, data: string, config: any) => {
    return Promise.resolve(__wrap_subinvoke("plugin/axios", "post", clean({ url, data, config })).value);
  },
  put: (url: string, data: string, config: any) => {
    return Promise.resolve(__wrap_subinvoke("plugin/axios", "put", clean({ url, data, config })).value);
  },
  delete: (url: string, config: any) => {
    return Promise.resolve(__wrap_subinvoke("plugin/axios", "delete", clean({ url, config })).value);
  },
  head: (url: string, config: any) => {
    return Promise.resolve(__wrap_subinvoke("plugin/axios", "head", clean({ url, config })).value);
  },
};