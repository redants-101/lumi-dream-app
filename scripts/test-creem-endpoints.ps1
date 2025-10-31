# Creem API Endpoint Testing Script
# Find the correct API endpoint path

$apiKey = "creem_test_2TDi7LxCo5acXCp231xJ7k"
$baseUrl = "https://test-api.creem.io"

$headers = @{
    "x-api-key" = $apiKey
    "Content-Type" = "application/json"
}

Write-Host "`n=== Testing Creem API Endpoints ===" -ForegroundColor Cyan

# Test different possible endpoints
$endpoints = @(
    "/checkout/sessions",
    "/api/checkout/sessions",
    "/v1/checkout/sessions",
    "/api/v1/checkout/sessions",
    "/checkout-sessions",
    "/api/checkout-sessions"
)

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$endpoint"
    Write-Host "`nTesting: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "  Endpoint NOT FOUND" -ForegroundColor Red
        } elseif ($statusCode -eq 405) {
            Write-Host "  Endpoint EXISTS but GET not allowed (good!)" -ForegroundColor Green
        } elseif ($statusCode -eq 401) {
            Write-Host "  API Key invalid" -ForegroundColor Red
        } else {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Testing Base Endpoints ===" -ForegroundColor Cyan

# Test basic endpoints
$baseEndpoints = @(
    "/products",
    "/api/products",
    "/v1/products",
    "/api/v1/products"
)

foreach ($endpoint in $baseEndpoints) {
    $url = "$baseUrl$endpoint"
    Write-Host "`nTesting: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $url -Headers $headers -ErrorAction Stop
        Write-Host "SUCCESS - Got data" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Green
        break
    } catch {
        Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
