import { AccessToken } from '../models/AccessToken';
import { PartialDeep } from '../models/PartialDeep';
import { RequiredDeep } from '../models/RequiredDeep';
import { RequestOptions } from '../models/RequestOptions';
import HttpClient from '../utils/HttpClient';
import OrderCloudError from '../utils/OrderCloudError';

export default class GroupOrders {
    private impersonating:boolean = false;
    private readonly http: HttpClient;

    /**
    * @ignore
    * not part of public api, don't include in generated docs
    */
    constructor(http: HttpClient) {
        this.http = http;
        this.GetToken = this.GetToken.bind(this);
    }

   /**
    * Retrieve a group order token 
    * Check out the {@link https://ordercloud.io/api-reference/orders-and-fulfillment/group-orders/get-token|api docs} for more info 
    * 
    * @param invitationID ID of the invitation.
    * @param requestOptions.accessToken Provide an alternative token to the one stored in the sdk instance (useful for impersonation).
    * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
    * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
    */
    public async GetToken<TAccessToken extends AccessToken>(invitationID: string, requestOptions: RequestOptions = {} ): Promise<RequiredDeep<TAccessToken>>{
        const impersonating = this.impersonating;
        this.impersonating = false;
        return await this.http.post(`/grouporders/${invitationID}/token`, { ...requestOptions, impersonating,  } )
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
     * GroupOrders.As().List() // lists GroupOrders using the impersonated users' token
     */
    public As(): this {
        this.impersonating = true;
        return this;
    }
}