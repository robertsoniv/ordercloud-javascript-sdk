import { SubscriptionIntegration } from '../models/SubscriptionIntegration';
import { PartialDeep } from '../models/PartialDeep';
import { RequiredDeep } from '../models/RequiredDeep';
import { RequestOptions } from '../models/RequestOptions';
import HttpClient from '../utils/HttpClient';
import OrderCloudError from '../utils/OrderCloudError';

export default class SubscriptionIntegrations {
    private impersonating:boolean = false;
    private readonly http: HttpClient;

    /**
    * @ignore
    * not part of public api, don't include in generated docs
    */
    constructor(http: HttpClient) {
        this.http = http;
        this.Get = this.Get.bind(this);
        this.Save = this.Save.bind(this);
        this.Delete = this.Delete.bind(this);
        this.Patch = this.Patch.bind(this);
    }

   /**
    * Retrieve a subscription integration 
    * Check out the {@link https://ordercloud.io/api-reference/integrations/subscription-integrations/get|api docs} for more info 
    * 
    * @param requestOptions.accessToken Provide an alternative token to the one stored in the sdk instance (useful for impersonation).
    * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
    * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
    */
    public async Get<TSubscriptionIntegration extends SubscriptionIntegration>(requestOptions: RequestOptions = {} ): Promise<RequiredDeep<TSubscriptionIntegration>>{
        const impersonating = this.impersonating;
        this.impersonating = false;
        return await this.http.get(`/integrations/subscription`, { ...requestOptions, impersonating,  } )
        .catch(ex => {
            // If it's already an OrderCloudError from HttpClient, just re-throw
            if(ex.isOrderCloudError) {
                throw ex;
            }
            // Legacy support: if it has .response but isn't OrderCloudError yet
            if(ex.response) {
                throw new OrderCloudError(ex)
            }
            throw ex;
        })
    }

   /**
    * Create or update a subscription integration If an object with the same ID already exists, it will be overwritten.
    * Check out the {@link https://ordercloud.io/api-reference/integrations/subscription-integrations/save|api docs} for more info 
    * 
    * @param subscriptionIntegration Required fields: ApiClientID, HashKey
    * @param requestOptions.accessToken Provide an alternative token to the one stored in the sdk instance (useful for impersonation).
    * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
    * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
    */
    public async Save<TSubscriptionIntegration extends SubscriptionIntegration>(subscriptionIntegration: SubscriptionIntegration,requestOptions: RequestOptions = {} ): Promise<RequiredDeep<TSubscriptionIntegration>>{
        const impersonating = this.impersonating;
        this.impersonating = false;
        return await this.http.put(`/integrations/subscription`, { ...requestOptions, body: subscriptionIntegration, impersonating,  } )
        .catch(ex => {
            // If it's already an OrderCloudError from HttpClient, just re-throw
            if(ex.isOrderCloudError) {
                throw ex;
            }
            // Legacy support: if it has .response but isn't OrderCloudError yet
            if(ex.response) {
                throw new OrderCloudError(ex)
            }
            throw ex;
        })
    }

   /**
    * Delete a subscription integration 
    * Check out the {@link https://ordercloud.io/api-reference/integrations/subscription-integrations/delete|api docs} for more info 
    * 
    * @param requestOptions.accessToken Provide an alternative token to the one stored in the sdk instance (useful for impersonation).
    * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
    * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
    */
    public async Delete(requestOptions: RequestOptions = {} ): Promise<void>{
        const impersonating = this.impersonating;
        this.impersonating = false;
        return await this.http.delete(`/integrations/subscription`, { ...requestOptions, impersonating,  } )
        .catch(ex => {
            // If it's already an OrderCloudError from HttpClient, just re-throw
            if(ex.isOrderCloudError) {
                throw ex;
            }
            // Legacy support: if it has .response but isn't OrderCloudError yet
            if(ex.response) {
                throw new OrderCloudError(ex)
            }
            throw ex;
        })
    }

   /**
    * Partially update a subscription integration 
    * Check out the {@link https://ordercloud.io/api-reference/integrations/subscription-integrations/patch|api docs} for more info 
    * 
    * @param subscriptionIntegration 
    * @param requestOptions.accessToken Provide an alternative token to the one stored in the sdk instance (useful for impersonation).
    * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
    * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
    */
    public async Patch<TSubscriptionIntegration extends SubscriptionIntegration>(subscriptionIntegration: PartialDeep<SubscriptionIntegration>, requestOptions: RequestOptions = {} ): Promise<RequiredDeep<TSubscriptionIntegration>>{
        const impersonating = this.impersonating;
        this.impersonating = false;
        return await this.http.patch(`/integrations/subscription`, { ...requestOptions, body: subscriptionIntegration, impersonating,  } )
        .catch(ex => {
            // If it's already an OrderCloudError from HttpClient, just re-throw
            if(ex.isOrderCloudError) {
                throw ex;
            }
            // Legacy support: if it has .response but isn't OrderCloudError yet
            if(ex.response) {
                throw new OrderCloudError(ex)
            }
            throw ex;
        })
    }

    /**
     * @description 
     * enables impersonation by calling the subsequent method with the stored impersonation token
     * 
     * @example
     * SubscriptionIntegrations.As().List() // lists SubscriptionIntegrations using the impersonated users' token
     */
    public As(): this {
        this.impersonating = true;
        return this;
    }
}