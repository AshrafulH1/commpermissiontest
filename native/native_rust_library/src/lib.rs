use lazy_static::lazy_static;
use std::sync::Arc;
use tokio::runtime::{Builder, Runtime};
use tonic::{transport::Channel, Status};
use tracing::instrument;

mod crypto_tools;
mod identity_client;
mod identity {
  tonic::include_proto!("identity");
}

use crypto_tools::generate_device_id;
use identity::identity_service_client::IdentityServiceClient;
use identity_client::{
  get_user_id, login_user_pake, login_user_wallet, register_user,
  verify_user_token,
};

lazy_static! {
  pub static ref RUNTIME: Arc<Runtime> = Arc::new(
    Builder::new_multi_thread()
      .worker_threads(1)
      .max_blocking_threads(1)
      .enable_all()
      .build()
      .unwrap()
  );
}

#[cxx::bridge]
mod ffi {

  enum DeviceType {
    KEYSERVER,
    WEB,
    MOBILE,
  }

  extern "Rust" {
    // Identity Service Client
    type IdentityClient;
    fn initialize_identity_client(addr: String) -> Box<IdentityClient>;
    fn get_user_id_blocking(
      client: Box<IdentityClient>,
      auth_type: i32,
      user_info: String,
    ) -> Result<String>;
    fn verify_user_token_blocking(
      client: Box<IdentityClient>,
      user_id: String,
      device_id: String,
      access_token: String,
    ) -> Result<bool>;
    fn register_user_blocking(
      client: Box<IdentityClient>,
      user_id: String,
      device_id: String,
      username: String,
      password: String,
      user_public_key: String,
    ) -> Result<String>;
    fn login_user_pake_blocking(
      client: Box<IdentityClient>,
      user_id: String,
      device_id: String,
      password: String,
      user_public_key: String,
    ) -> Result<String>;
    fn login_user_wallet_blocking(
      client: Box<IdentityClient>,
      user_id: String,
      device_id: String,
      siwe_message: String,
      siwe_signature: Vec<u8>,
      user_public_key: String,
    ) -> Result<String>;
    // Crypto Tools
    fn generate_device_id(device_type: DeviceType) -> Result<String>;
  }
}

#[derive(Debug)]
pub struct IdentityClient {
  identity_client: IdentityServiceClient<Channel>,
}

fn initialize_identity_client(addr: String) -> Box<IdentityClient> {
  Box::new(IdentityClient {
    identity_client: RUNTIME
      .block_on(IdentityServiceClient::connect(addr))
      .unwrap(),
  })
}

#[instrument]
fn get_user_id_blocking(
  client: Box<IdentityClient>,
  auth_type: i32,
  user_info: String,
) -> Result<String, Status> {
  RUNTIME.block_on(get_user_id(client, auth_type, user_info))
}

#[instrument]
fn verify_user_token_blocking(
  client: Box<IdentityClient>,
  user_id: String,
  device_id: String,
  access_token: String,
) -> Result<bool, Status> {
  RUNTIME.block_on(verify_user_token(client, user_id, device_id, access_token))
}

#[instrument]
fn register_user_blocking(
  client: Box<IdentityClient>,
  user_id: String,
  device_id: String,
  username: String,
  password: String,
  user_public_key: String,
) -> Result<String, Status> {
  RUNTIME.block_on(register_user(
    client,
    user_id,
    device_id,
    username,
    password,
    user_public_key,
  ))
}

#[instrument]
fn login_user_pake_blocking(
  client: Box<IdentityClient>,
  user_id: String,
  device_id: String,
  password: String,
  user_public_key: String,
) -> Result<String, Status> {
  RUNTIME.block_on(login_user_pake(
    client,
    user_id,
    device_id,
    password,
    user_public_key,
  ))
}

#[instrument]
fn login_user_wallet_blocking(
  client: Box<IdentityClient>,
  user_id: String,
  device_id: String,
  siwe_message: String,
  siwe_signature: Vec<u8>,
  user_public_key: String,
) -> Result<String, Status> {
  RUNTIME.block_on(login_user_wallet(
    client,
    user_id,
    device_id,
    siwe_message,
    siwe_signature,
    user_public_key,
  ))
}
