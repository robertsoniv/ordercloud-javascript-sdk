import { Configuration } from '../configuration'
import { AuthManager } from '../api/AuthManager'
import HttpClient from '../utils/HttpClient'
import CookieService from '../utils/CookieService'
import Auth from '../api/Auth'
import { SdkConfiguration } from '../models'
import { InterceptorContainer } from '../core/InterceptorManager'

// Import all resource classes
import ApiClients from '../api/ApiClients'
import SecurityProfiles from '../api/SecurityProfiles'
import ForgottenCredentials from '../api/ForgottenCredentials'
import ImpersonationConfigs from '../api/ImpersonationConfigs'
import OpenIdConnects from '../api/OpenIdConnects'
import AdminUsers from '../api/AdminUsers'
import AdminUserGroups from '../api/AdminUserGroups'
import AdminAddresses from '../api/AdminAddresses'
import Incrementors from '../api/Incrementors'
import Locales from '../api/Locales'
import Webhooks from '../api/Webhooks'
import XpIndices from '../api/XpIndices'
import Buyers from '../api/Buyers'
import Users from '../api/Users'
import UserGroups from '../api/UserGroups'
import Addresses from '../api/Addresses'
import CostCenters from '../api/CostCenters'
import CreditCards from '../api/CreditCards'
import SpendingAccounts from '../api/SpendingAccounts'
import ApprovalRules from '../api/ApprovalRules'
import ProductCollections from '../api/ProductCollections'
import Suppliers from '../api/Suppliers'
import SupplierUsers from '../api/SupplierUsers'
import SupplierUserGroups from '../api/SupplierUserGroups'
import SupplierAddresses from '../api/SupplierAddresses'
import Catalogs from '../api/Catalogs'
import Categories from '../api/Categories'
import Products from '../api/Products'
import PriceSchedules from '../api/PriceSchedules'
import Specs from '../api/Specs'
import ProductFacets from '../api/ProductFacets'
import InventoryRecords from '../api/InventoryRecords'
import Bundles from '../api/Bundles'
import Orders from '../api/Orders'
import Cart from '../api/Cart'
import LineItems from '../api/LineItems'
import Promotions from '../api/Promotions'
import Payments from '../api/Payments'
import Shipments from '../api/Shipments'
import OrderReturns from '../api/OrderReturns'
import SellerApprovalRules from '../api/SellerApprovalRules'
import BundleLineItems from '../api/BundleLineItems'
import BundleSubscriptionItems from '../api/BundleSubscriptionItems'
import GroupOrders from '../api/GroupOrders'
import SubscriptionItems from '../api/SubscriptionItems'
import Subscriptions from '../api/Subscriptions'
import Me from '../api/Me'
import TrackingEvents from '../api/TrackingEvents'
import DeliveryConfigurations from '../api/DeliveryConfigurations'
import EntitySynchronization from '../api/EntitySynchronization'
import ErrorConfigs from '../api/ErrorConfigs'
import IntegrationEvents from '../api/IntegrationEvents'
import InventoryIntegrations from '../api/InventoryIntegrations'
import MessageSenders from '../api/MessageSenders'
import OrderSynchronization from '../api/OrderSynchronization'
import ProductSynchronization from '../api/ProductSynchronization'
import PromotionIntegrations from '../api/PromotionIntegrations'
import SubscriptionIntegrations from '../api/SubscriptionIntegrations'
import UserInfo from '../api/UserInfo'
import Certs from '../api/Certs'

/**
 * OrderCloud SDK Client
 *
 * Provides access to all OrderCloud API resources through a single instance.
 * Each client instance maintains its own configuration, authentication state, and interceptors.
 *
 * @example
 * ```typescript
 * const client = new OrderCloudClient({
 *   clientID: 'my-client-id',
 *   baseApiUrl: 'https://api.ordercloud.io'
 * })
 *
 * await client.Auth.Login('username', 'password')
 * const products = await client.Products.List()
 * ```
 */
export class OrderCloudClient {
  /**
   * Interceptor container for adding request/response interceptors
   * @example
   * client.interceptors.request.use((config) => {
   *   config.headers = { ...config.headers, 'X-Custom': 'value' }
   *   return config
   * })
   */
  public readonly interceptors: InterceptorContainer

  private readonly _config: Configuration
  private readonly _authManager: AuthManager
  private readonly _httpClient: HttpClient
  private readonly _auth: Auth

  // Private fields for lazy-loaded resources
  private _apiClients?: ApiClients
  private _securityProfiles?: SecurityProfiles
  private _forgottenCredentials?: ForgottenCredentials
  private _impersonationConfigs?: ImpersonationConfigs
  private _openIdConnects?: OpenIdConnects
  private _adminUsers?: AdminUsers
  private _adminUserGroups?: AdminUserGroups
  private _adminAddresses?: AdminAddresses
  private _incrementors?: Incrementors
  private _locales?: Locales
  private _webhooks?: Webhooks
  private _xpIndices?: XpIndices
  private _buyers?: Buyers
  private _users?: Users
  private _userGroups?: UserGroups
  private _addresses?: Addresses
  private _costCenters?: CostCenters
  private _creditCards?: CreditCards
  private _spendingAccounts?: SpendingAccounts
  private _approvalRules?: ApprovalRules
  private _productCollections?: ProductCollections
  private _suppliers?: Suppliers
  private _supplierUsers?: SupplierUsers
  private _supplierUserGroups?: SupplierUserGroups
  private _supplierAddresses?: SupplierAddresses
  private _catalogs?: Catalogs
  private _categories?: Categories
  private _products?: Products
  private _priceSchedules?: PriceSchedules
  private _specs?: Specs
  private _productFacets?: ProductFacets
  private _inventoryRecords?: InventoryRecords
  private _bundles?: Bundles
  private _orders?: Orders
  private _cart?: Cart
  private _lineItems?: LineItems
  private _promotions?: Promotions
  private _payments?: Payments
  private _shipments?: Shipments
  private _orderReturns?: OrderReturns
  private _sellerApprovalRules?: SellerApprovalRules
  private _bundleLineItems?: BundleLineItems
  private _bundleSubscriptionItems?: BundleSubscriptionItems
  private _groupOrders?: GroupOrders
  private _subscriptionItems?: SubscriptionItems
  private _subscriptions?: Subscriptions
  private _me?: Me
  private _trackingEvents?: TrackingEvents
  private _deliveryConfigurations?: DeliveryConfigurations
  private _entitySynchronization?: EntitySynchronization
  private _errorConfigs?: ErrorConfigs
  private _integrationEvents?: IntegrationEvents
  private _inventoryIntegrations?: InventoryIntegrations
  private _messageSenders?: MessageSenders
  private _orderSynchronization?: OrderSynchronization
  private _productSynchronization?: ProductSynchronization
  private _promotionIntegrations?: PromotionIntegrations
  private _subscriptionIntegrations?: SubscriptionIntegrations
  private _userInfo?: UserInfo
  private _certs?: Certs

  /**
   * Creates a new OrderCloud client instance
   * @param config Partial configuration - any missing properties use defaults
   */
  constructor(config: Partial<SdkConfiguration> = {}) {
    // Initialize configuration with defaults
    this._config = new Configuration(config)
    this.interceptors = this._config.interceptors

    // Initialize authentication and HTTP client
    const cookieService = new CookieService(this._config)
    this._authManager = new AuthManager(this._config, cookieService)
    this._httpClient = new HttpClient(this._config, this._authManager)
    this._auth = new Auth(this._config, this._authManager)
  }

  /**
   * Authentication resource (not lazy-loaded)
   */
  public get Auth(): Auth {
    return this._auth
  }

  // Lazy-loaded resource getters
  public get ApiClients(): ApiClients {
    if (!this._apiClients) {
      this._apiClients = new ApiClients(this._httpClient)
    }
    return this._apiClients
  }

  public get SecurityProfiles(): SecurityProfiles {
    if (!this._securityProfiles) {
      this._securityProfiles = new SecurityProfiles(this._httpClient)
    }
    return this._securityProfiles
  }

  public get ForgottenCredentials(): ForgottenCredentials {
    if (!this._forgottenCredentials) {
      this._forgottenCredentials = new ForgottenCredentials(this._httpClient)
    }
    return this._forgottenCredentials
  }

  public get ImpersonationConfigs(): ImpersonationConfigs {
    if (!this._impersonationConfigs) {
      this._impersonationConfigs = new ImpersonationConfigs(this._httpClient)
    }
    return this._impersonationConfigs
  }

  public get OpenIdConnects(): OpenIdConnects {
    if (!this._openIdConnects) {
      this._openIdConnects = new OpenIdConnects(this._httpClient)
    }
    return this._openIdConnects
  }

  public get AdminUsers(): AdminUsers {
    if (!this._adminUsers) {
      this._adminUsers = new AdminUsers(this._httpClient)
    }
    return this._adminUsers
  }

  public get AdminUserGroups(): AdminUserGroups {
    if (!this._adminUserGroups) {
      this._adminUserGroups = new AdminUserGroups(this._httpClient)
    }
    return this._adminUserGroups
  }

  public get AdminAddresses(): AdminAddresses {
    if (!this._adminAddresses) {
      this._adminAddresses = new AdminAddresses(this._httpClient)
    }
    return this._adminAddresses
  }

  public get Incrementors(): Incrementors {
    if (!this._incrementors) {
      this._incrementors = new Incrementors(this._httpClient)
    }
    return this._incrementors
  }

  public get Locales(): Locales {
    if (!this._locales) {
      this._locales = new Locales(this._httpClient)
    }
    return this._locales
  }

  public get Webhooks(): Webhooks {
    if (!this._webhooks) {
      this._webhooks = new Webhooks(this._httpClient)
    }
    return this._webhooks
  }

  public get XpIndices(): XpIndices {
    if (!this._xpIndices) {
      this._xpIndices = new XpIndices(this._httpClient)
    }
    return this._xpIndices
  }

  public get Buyers(): Buyers {
    if (!this._buyers) {
      this._buyers = new Buyers(this._httpClient)
    }
    return this._buyers
  }

  public get Users(): Users {
    if (!this._users) {
      this._users = new Users(this._httpClient)
    }
    return this._users
  }

  public get UserGroups(): UserGroups {
    if (!this._userGroups) {
      this._userGroups = new UserGroups(this._httpClient)
    }
    return this._userGroups
  }

  public get Addresses(): Addresses {
    if (!this._addresses) {
      this._addresses = new Addresses(this._httpClient)
    }
    return this._addresses
  }

  public get CostCenters(): CostCenters {
    if (!this._costCenters) {
      this._costCenters = new CostCenters(this._httpClient)
    }
    return this._costCenters
  }

  public get CreditCards(): CreditCards {
    if (!this._creditCards) {
      this._creditCards = new CreditCards(this._httpClient)
    }
    return this._creditCards
  }

  public get SpendingAccounts(): SpendingAccounts {
    if (!this._spendingAccounts) {
      this._spendingAccounts = new SpendingAccounts(this._httpClient)
    }
    return this._spendingAccounts
  }

  public get ApprovalRules(): ApprovalRules {
    if (!this._approvalRules) {
      this._approvalRules = new ApprovalRules(this._httpClient)
    }
    return this._approvalRules
  }

  public get ProductCollections(): ProductCollections {
    if (!this._productCollections) {
      this._productCollections = new ProductCollections(this._httpClient)
    }
    return this._productCollections
  }

  public get Suppliers(): Suppliers {
    if (!this._suppliers) {
      this._suppliers = new Suppliers(this._httpClient)
    }
    return this._suppliers
  }

  public get SupplierUsers(): SupplierUsers {
    if (!this._supplierUsers) {
      this._supplierUsers = new SupplierUsers(this._httpClient)
    }
    return this._supplierUsers
  }

  public get SupplierUserGroups(): SupplierUserGroups {
    if (!this._supplierUserGroups) {
      this._supplierUserGroups = new SupplierUserGroups(this._httpClient)
    }
    return this._supplierUserGroups
  }

  public get SupplierAddresses(): SupplierAddresses {
    if (!this._supplierAddresses) {
      this._supplierAddresses = new SupplierAddresses(this._httpClient)
    }
    return this._supplierAddresses
  }

  public get Catalogs(): Catalogs {
    if (!this._catalogs) {
      this._catalogs = new Catalogs(this._httpClient)
    }
    return this._catalogs
  }

  public get Categories(): Categories {
    if (!this._categories) {
      this._categories = new Categories(this._httpClient)
    }
    return this._categories
  }

  public get Products(): Products {
    if (!this._products) {
      this._products = new Products(this._httpClient)
    }
    return this._products
  }

  public get PriceSchedules(): PriceSchedules {
    if (!this._priceSchedules) {
      this._priceSchedules = new PriceSchedules(this._httpClient)
    }
    return this._priceSchedules
  }

  public get Specs(): Specs {
    if (!this._specs) {
      this._specs = new Specs(this._httpClient)
    }
    return this._specs
  }

  public get ProductFacets(): ProductFacets {
    if (!this._productFacets) {
      this._productFacets = new ProductFacets(this._httpClient)
    }
    return this._productFacets
  }

  public get InventoryRecords(): InventoryRecords {
    if (!this._inventoryRecords) {
      this._inventoryRecords = new InventoryRecords(this._httpClient)
    }
    return this._inventoryRecords
  }

  public get Bundles(): Bundles {
    if (!this._bundles) {
      this._bundles = new Bundles(this._httpClient)
    }
    return this._bundles
  }

  public get Orders(): Orders {
    if (!this._orders) {
      this._orders = new Orders(this._httpClient)
    }
    return this._orders
  }

  public get Cart(): Cart {
    if (!this._cart) {
      this._cart = new Cart(this._httpClient)
    }
    return this._cart
  }

  public get LineItems(): LineItems {
    if (!this._lineItems) {
      this._lineItems = new LineItems(this._httpClient)
    }
    return this._lineItems
  }

  public get Promotions(): Promotions {
    if (!this._promotions) {
      this._promotions = new Promotions(this._httpClient)
    }
    return this._promotions
  }

  public get Payments(): Payments {
    if (!this._payments) {
      this._payments = new Payments(this._httpClient)
    }
    return this._payments
  }

  public get Shipments(): Shipments {
    if (!this._shipments) {
      this._shipments = new Shipments(this._httpClient)
    }
    return this._shipments
  }

  public get OrderReturns(): OrderReturns {
    if (!this._orderReturns) {
      this._orderReturns = new OrderReturns(this._httpClient)
    }
    return this._orderReturns
  }

  public get SellerApprovalRules(): SellerApprovalRules {
    if (!this._sellerApprovalRules) {
      this._sellerApprovalRules = new SellerApprovalRules(this._httpClient)
    }
    return this._sellerApprovalRules
  }

  public get BundleLineItems(): BundleLineItems {
    if (!this._bundleLineItems) {
      this._bundleLineItems = new BundleLineItems(this._httpClient)
    }
    return this._bundleLineItems
  }

  public get BundleSubscriptionItems(): BundleSubscriptionItems {
    if (!this._bundleSubscriptionItems) {
      this._bundleSubscriptionItems = new BundleSubscriptionItems(this._httpClient)
    }
    return this._bundleSubscriptionItems
  }

  public get GroupOrders(): GroupOrders {
    if (!this._groupOrders) {
      this._groupOrders = new GroupOrders(this._httpClient)
    }
    return this._groupOrders
  }

  public get SubscriptionItems(): SubscriptionItems {
    if (!this._subscriptionItems) {
      this._subscriptionItems = new SubscriptionItems(this._httpClient)
    }
    return this._subscriptionItems
  }

  public get Subscriptions(): Subscriptions {
    if (!this._subscriptions) {
      this._subscriptions = new Subscriptions(this._httpClient)
    }
    return this._subscriptions
  }

  public get Me(): Me {
    if (!this._me) {
      this._me = new Me(this._httpClient)
    }
    return this._me
  }

  public get TrackingEvents(): TrackingEvents {
    if (!this._trackingEvents) {
      this._trackingEvents = new TrackingEvents(this._httpClient)
    }
    return this._trackingEvents
  }

  public get DeliveryConfigurations(): DeliveryConfigurations {
    if (!this._deliveryConfigurations) {
      this._deliveryConfigurations = new DeliveryConfigurations(this._httpClient)
    }
    return this._deliveryConfigurations
  }

  public get EntitySynchronization(): EntitySynchronization {
    if (!this._entitySynchronization) {
      this._entitySynchronization = new EntitySynchronization(this._httpClient)
    }
    return this._entitySynchronization
  }

  public get ErrorConfigs(): ErrorConfigs {
    if (!this._errorConfigs) {
      this._errorConfigs = new ErrorConfigs(this._httpClient)
    }
    return this._errorConfigs
  }

  public get IntegrationEvents(): IntegrationEvents {
    if (!this._integrationEvents) {
      this._integrationEvents = new IntegrationEvents(this._httpClient)
    }
    return this._integrationEvents
  }

  public get InventoryIntegrations(): InventoryIntegrations {
    if (!this._inventoryIntegrations) {
      this._inventoryIntegrations = new InventoryIntegrations(this._httpClient)
    }
    return this._inventoryIntegrations
  }

  public get MessageSenders(): MessageSenders {
    if (!this._messageSenders) {
      this._messageSenders = new MessageSenders(this._httpClient)
    }
    return this._messageSenders
  }

  public get OrderSynchronization(): OrderSynchronization {
    if (!this._orderSynchronization) {
      this._orderSynchronization = new OrderSynchronization(this._httpClient)
    }
    return this._orderSynchronization
  }

  public get ProductSynchronization(): ProductSynchronization {
    if (!this._productSynchronization) {
      this._productSynchronization = new ProductSynchronization(this._httpClient)
    }
    return this._productSynchronization
  }

  public get PromotionIntegrations(): PromotionIntegrations {
    if (!this._promotionIntegrations) {
      this._promotionIntegrations = new PromotionIntegrations(this._httpClient)
    }
    return this._promotionIntegrations
  }

  public get SubscriptionIntegrations(): SubscriptionIntegrations {
    if (!this._subscriptionIntegrations) {
      this._subscriptionIntegrations = new SubscriptionIntegrations(this._httpClient)
    }
    return this._subscriptionIntegrations
  }

  public get UserInfo(): UserInfo {
    if (!this._userInfo) {
      this._userInfo = new UserInfo(this._httpClient)
    }
    return this._userInfo
  }

  public get Certs(): Certs {
    if (!this._certs) {
      this._certs = new Certs(this._httpClient)
    }
    return this._certs
  }
}
