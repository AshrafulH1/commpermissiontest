#pragma once

#include <random>
#include <string>

namespace comm {
namespace network {

std::string generateRandomString(std::size_t length);

long long getCurrentTimestamp();

} // namespace network
} // namespace comm