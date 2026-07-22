import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import  { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';

@Injectable()
export class AxiosClientService implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    const axios = this.httpService.axiosRef;

 
    axios.interceptors.request.use((config: AxiosRequestConfig): any => {
      logger.info({
        type: 'REQUEST',
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data,
      });
      return config;
    });

    
    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.info({
          type: 'RESPONSE',
          status: response.status,
          method: response.config.method,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        logger.error({
          type: 'ERROR',
          method: error.config?.method,
          url: error.config?.url,
          message: error.message,
          response: error.response?.data,
        });
        return Promise.reject(error);
      },
    );
  }

  // Get Request Method
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.httpService.get<T>(url, config).toPromise();
  }

  // Post Request Method
  async post<T = any>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<any> {
    return this.httpService.post<T>(url, data, config).toPromise();
  }

  // Put Request Method
  async put<T = any>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<any> {
    return this.httpService.put<T>(url, data, config).toPromise();
  }

  // Delete Request Method
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<any> {
    return this.httpService.delete<T>(url, config).toPromise();
  }

  async getWithBody<T = any>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const rawHeaders = config?.headers;

    
    let parsedHeaders = {
      'Content-Type': 'application/json',
    };

    if (rawHeaders) {
      if (
        typeof rawHeaders === 'object' &&
        typeof (rawHeaders as AxiosHeaders).toJSON === 'function'
      ) {
        parsedHeaders = {
          ...parsedHeaders,
          ...(rawHeaders as AxiosHeaders).toJSON(),
        };
      } else {
        parsedHeaders = {
          ...parsedHeaders,
          ...(rawHeaders as Record<string, string>),
        };
      }
    }


    const axios = this.httpService.axiosRef;

    const response = await axios({
      url,
      method: 'GET',
      headers: parsedHeaders,
      data,
    });

   
    if (response.status != 200) {
      throw new Error(`GET with body failed: ${response.data}`);
    }

    return response.data as T;
  }
}
