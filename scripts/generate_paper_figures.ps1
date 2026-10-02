Add-Type -AssemblyName System.Drawing

function Create-Architecture-Diagram {
    param([string]$outputPath)
    $width = 1200
    $height = 700
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    
    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(250, 250, 252))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)
    
    # Fonts
    $titleFont = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
    $headerFont = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
    $bodyFont = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Regular)
    $arrowFont = New-Object System.Drawing.Font("Arial", 8, [System.Drawing.FontStyle]::Italic)
    
    # Brushes & Pens
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 41, 59))
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 116, 139))
    $edgePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(2, 132, 199), 2)
    $computePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(99, 102, 241), 2)
    $storagePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(16, 185, 129), 2)
    $clientPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(245, 158, 11), 2)
    $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(203, 213, 225), 1)
    
    # Title
    $g.DrawString("Mirza Footwear: Colocated Edge-Serverless System Topology", $titleFont, $textBrush, 30, 20)
    $g.DrawString("Mumbai Metropolitan Region (Vercel bom1 & Supabase ap-south-1)", $arrowFont, $mutedBrush, 32, 48)
    
    # Tier 1: Client Tier
    $clientBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(254, 243, 199))
    $g.FillRectangle($clientBrush, 40, 90, 240, 560)
    $g.DrawRectangle($clientPen, 40, 90, 240, 560)
    $g.DrawString("USER BROWSER / CLIENT", $headerFont, $textBrush, 55, 105)
    
    $boxBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    # Sub-boxes in Client
    $g.FillRectangle($boxBrush, 55, 145, 210, 100)
    $g.DrawRectangle($borderPen, 55, 145, 210, 100)
    $g.DrawString("React 19 Islands", $subFont, $textBrush, 65, 155)
    $g.DrawString("• Cart Drawer & State`n• Variant Picker`n• Stock Indicators", $bodyFont, $mutedBrush, 65, 178)
    
    $g.FillRectangle($boxBrush, 55, 265, 210, 110)
    $g.DrawRectangle($borderPen, 55, 265, 210, 110)
    $g.DrawString("Intent Engine (P1/R012)", $subFont, $textBrush, 65, 275)
    $g.DrawString("• pointerenter / touchstart`n• Preload PDP Hero Image`n• Zero Duplicate Requests", $bodyFont, $mutedBrush, 65, 298)
    
    $g.FillRectangle($boxBrush, 55, 395, 210, 110)
    $g.DrawRectangle($borderPen, 55, 395, 210, 110)
    $g.DrawString("S8 Cart State Sync", $subFont, $textBrush, 65, 405)
    $g.DrawString("• SHA-256 Bearer Token`n• Direct Context Update`n• 0 Navigation Polling", $bodyFont, $mutedBrush, 65, 428)
    
    $g.FillRectangle($boxBrush, 55, 525, 210, 100)
    $g.DrawRectangle($borderPen, 55, 525, 210, 100)
    $g.DrawString("Razorpay Checkout", $subFont, $textBrush, 65, 535)
    $g.DrawString("• Lazy Modal Overlay`n• HMAC-SHA256 Client Sign`n• Zero Replay Risk", $bodyFont, $mutedBrush, 65, 558)
    
    # Tier 2: Edge CDN
    $edgeBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(224, 242, 254))
    $g.FillRectangle($edgeBg, 330, 90, 250, 560)
    $g.DrawRectangle($edgePen, 330, 90, 250, 560)
    $g.DrawString("VERCEL GLOBAL EDGE", $headerFont, $textBrush, 345, 105)
    $g.DrawString("Mumbai Edge PoP (bom1)", $arrowFont, $mutedBrush, 347, 128)
    
    $g.FillRectangle($boxBrush, 345, 155, 220, 130)
    $g.DrawRectangle($borderPen, 345, 155, 220, 130)
    $g.DrawString("Partial Prerendering", $subFont, $textBrush, 355, 165)
    $g.DrawString("• PPR Chunk 0 (Instant Shell)`n• Navigation & Layout Chrome`n• Blank-after-TTFB < 55ms`n• s-maxage Edge Cache", $bodyFont, $mutedBrush, 355, 188)
    
    $g.FillRectangle($boxBrush, 345, 305, 220, 140)
    $g.DrawRectangle($borderPen, 345, 305, 220, 140)
    $g.DrawString("Next Image Optimizer", $subFont, $textBrush, 355, 315)
    $g.DrawString("• Responsive AVIF / WebP`n• Dynamic Viewport Sizing`n• 31-Day Immutable Cache`n• 40-80% Payload Savings", $bodyFont, $mutedBrush, 355, 338)
    
    $g.FillRectangle($boxBrush, 345, 465, 220, 140)
    $g.DrawRectangle($borderPen, 345, 465, 220, 140)
    $g.DrawString("Canonical Cache Policy", $subFont, $textBrush, 355, 475)
    $g.DrawString("• Centralized Cache Headers`n• Zero Warm Set-Cookie`n• Geo-Routing Middleware`n• Fast Edge Purging", $bodyFont, $mutedBrush, 355, 498)
    
    # Tier 3: Compute Tier
    $computeBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(238, 242, 255))
    $g.FillRectangle($computeBg, 630, 90, 250, 560)
    $g.DrawRectangle($computePen, 630, 90, 250, 560)
    $g.DrawString("NEXT.JS 16 SERVERLESS", $headerFont, $textBrush, 645, 105)
    $g.DrawString("Node.js Runtime (bom1)", $arrowFont, $mutedBrush, 647, 128)
    
    $g.FillRectangle($boxBrush, 645, 155, 220, 140)
    $g.DrawRectangle($borderPen, 645, 155, 220, 140)
    $g.DrawString("Catalog Repository", $subFont, $textBrush, 655, 165)
    $g.DrawString("• Bounded 4-Query Snapshot`n• Tag: catalog-public`n• Warm Snapshot: 0 Queries`n• In-Process Filter/Sort", $bodyFont, $mutedBrush, 655, 188)
    
    $g.FillRectangle($boxBrush, 645, 315, 220, 130)
    $g.DrawRectangle($borderPen, 645, 315, 220, 130)
    $g.DrawString("Server-Only DAL (pg)", $subFont, $textBrush, 655, 325)
    $g.DrawString("• Strict TLS rejectUnauthorized`n• Atomic Order Placement`n• Zero Client Bundle Leak`n• Pooled Connections", $bodyFont, $mutedBrush, 655, 348)
    
    $g.FillRectangle($boxBrush, 645, 465, 220, 140)
    $g.DrawRectangle($borderPen, 645, 465, 220, 140)
    $g.DrawString("Media Contract v1 DAL", $subFont, $textBrush, 655, 475)
    $g.DrawString("• Sharp Server Validation`n• LQIP & Dominant Color`n• Direct Signed Uploads`n• Placement Decoupled", $bodyFont, $mutedBrush, 655, 498)
    
    # Tier 4: Managed Persistence & Auth
    $storageBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(236, 253, 245))
    $g.FillRectangle($storageBg, 930, 90, 230, 560)
    $g.DrawRectangle($storagePen, 930, 90, 230, 560)
    $g.DrawString("SUPABASE ap-south-1", $headerFont, $textBrush, 945, 105)
    $g.DrawString("Managed Cloud Infrastructure", $arrowFont, $mutedBrush, 947, 128)
    
    $g.FillRectangle($boxBrush, 945, 155, 200, 140)
    $g.DrawRectangle($borderPen, 945, 155, 200, 140)
    $g.DrawString("PostgreSQL DB", $subFont, $textBrush, 955, 165)
    $g.DrawString("• products / variants`n• categories / taxonomy`n• carts / cart_items`n• orders / order_items`n• media_assets & placements", $bodyFont, $mutedBrush, 955, 188)
    
    $g.FillRectangle($boxBrush, 945, 315, 200, 130)
    $g.DrawRectangle($borderPen, 945, 315, 200, 130)
    $g.DrawString("Supabase Storage", $subFont, $textBrush, 955, 325)
    $g.DrawString("• Bucket: product-media`n• Immutable Master Assets`n• Signed Upload Target`n• Direct CDN Delivery", $bodyFont, $mutedBrush, 955, 348)
    
    $g.FillRectangle($boxBrush, 945, 465, 200, 140)
    $g.DrawRectangle($borderPen, 945, 465, 200, 140)
    $g.DrawString("Supabase Auth", $subFont, $textBrush, 955, 475)
    $g.DrawString("• @supabase/ssr Sessions`n• Verified claims.sub`n• Role Authority (Admin)`n• Zero Token in Public Cache", $bodyFont, $mutedBrush, 955, 498)
    
    # Arrows between tiers
    $arrowPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(71, 85, 105), 2)
    $arrowPen.CustomEndCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(5, 5)
    
    # Client <-> Edge
    $g.DrawLine($arrowPen, 280, 200, 330, 200)
    $g.DrawLine($arrowPen, 330, 230, 280, 230)
    
    # Edge <-> Compute
    $g.DrawLine($arrowPen, 580, 200, 630, 200)
    $g.DrawLine($arrowPen, 630, 230, 580, 230)
    
    # Compute <-> Storage
    $g.DrawLine($arrowPen, 880, 200, 930, 200)
    $g.DrawLine($arrowPen, 930, 230, 880, 230)
    
    # Direct edge to storage for media
    $mediaPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(16, 185, 129), 2)
    $mediaPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $mediaPen.CustomEndCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(5, 5)
    $g.DrawLine($mediaPen, 565, 375, 945, 375)
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created $outputPath"
}

function Create-Waterfall-Diagram {
    param([string]$outputPath)
    $width = 1100
    $height = 550
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)
    
    $titleFont = New-Object System.Drawing.Font("Arial", 15, [System.Drawing.FontStyle]::Bold)
    $labelFont = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Regular)
    $barFont = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
    
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 116, 139))
    $redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(239, 68, 68))
    $greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34, 197, 94))
    $blueBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(59, 130, 246))
    $amberBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 158, 11))
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    
    $g.DrawString("Resource Discovery Timeline: Serial Waterfall vs. Intent Prewarming (R012)", $titleFont, $textBrush, 30, 20)
    $g.DrawString("Desktop Cold PDP Navigation Comparison (Values in milliseconds relative to user click)", $subFont, $mutedBrush, 32, 48)
    
    # Time Grid lines: 0 to 1500 ms (step 200 ms)
    $originX = 220
    $scale = 0.52 # pixels per ms
    for ($ms = 0; $ms -le 1500; $ms += 250) {
        $x = $originX + ($ms * $scale)
        $g.DrawLine($gridPen, $x, 80, $x, 480)
        $g.DrawString("${ms}ms", $subFont, $mutedBrush, $x - 18, 488)
    }
    
    # Section A: Baseline
    $g.DrawString("(A) Baseline Serial Waterfall (Cold Route Navigation)", $labelFont, $textBrush, 30, 95)
    
    # Bar 1: User Click at 0ms
    $g.DrawString("Route Navigation (RSC)", $subFont, $textBrush, 30, 130)
    $g.FillRectangle($blueBrush, $originX, 125, 442, 28) # 0 to 850ms
    $g.DrawString("Server Data Fetch & RSC Stream (850 ms)", $barFont, $whiteBrush, $originX + 15, 131)
    
    # Bar 2: Title Paints at 858ms
    $g.DrawString("Product Title Paint", $subFont, $textBrush, 30, 170)
    $titleX = $originX + (858 * $scale)
    $g.FillRectangle($amberBrush, $titleX, 165, 40, 28)
    $g.DrawString("Title Paints (858 ms)", $barFont, $textBrush, $titleX + 48, 171)
    
    # Bar 3: Late Image Discovery & Download
    $g.DrawString("Hero Image Discovery", $subFont, $textBrush, 30, 210)
    $imgStartX = $originX + (870 * $scale)
    $imgWidth = 530 * $scale
    $g.FillRectangle($redBrush, $imgStartX, 205, $imgWidth, 28) # 870 to 1400ms
    $g.DrawString("Late Discovery & Image Fetch (530 ms)", $barFont, $whiteBrush, $imgStartX + 10, 211)
    
    # Visual Gap annotation
    $gapPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(220, 38, 38), 2)
    $gapPen.CustomEndCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(4, 4)
    $gapPen.CustomStartCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(4, 4)
    $g.DrawLine($gapPen, $titleX + 10, 250, $imgStartX + $imgWidth, 250)
    $g.DrawString("Title-to-Hero Lag: ~530-558 ms (Delayed LCP)", $barFont, $redBrush, $titleX + 20, 260)
    
    # Section B: R012 Intent Prewarming
    $sepPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(203, 213, 225), 1)
    $g.DrawLine($sepPen, 30, 295, 1050, 295)
    
    $g.DrawString("(B) R012 Intent Prewarming (pointerenter / touchstart 250ms Prior to Click)", $labelFont, $textBrush, 30, 310)
    
    # Bar 4: Prewarm Hero Image at -250ms
    $g.DrawString("Preload Hero Candidate", $subFont, $textBrush, 30, 345)
    $prewarmX = $originX - (250 * $scale)
    $prewarmW = 480 * $scale
    $g.FillRectangle($greenBrush, $prewarmX, 340, $prewarmW, 28)
    $g.DrawString("Exact Responsive Hero Prewarm (Memory Cached)", $barFont, $whiteBrush, $prewarmX + 10, 346)
    
    # Bar 5: Route Navigation RSC
    $g.DrawString("Route Navigation (RSC)", $subFont, $textBrush, 30, 385)
    $g.FillRectangle($blueBrush, $originX, 380, 350, 28) # 0 to 670ms
    $g.DrawString("Server Data Fetch & RSC Stream (670 ms)", $barFont, $whiteBrush, $originX + 15, 386)
    
    # Bar 6: Simultaneous Title & Hero Paint
    $g.DrawString("Title & Hero Paint", $subFont, $textBrush, 30, 425)
    $heroPaintX = $originX + (672 * $scale)
    $g.FillRectangle($greenBrush, $heroPaintX, 420, 30, 28)
    $g.DrawString("Title & Hero Paint Simultaneously (672 ms, Lag: 2.1 ms) - LCP Complete!", $barFont, $greenBrush, $heroPaintX + 38, 426)
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created $outputPath"
}

function Create-Metrics-BarChart {
    param([string]$outputPath)
    $width = 1100
    $height = 550
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)
    
    $titleFont = New-Object System.Drawing.Font("Arial", 15, [System.Drawing.FontStyle]::Bold)
    $labelFont = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Regular)
    $barFont = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
    
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 116, 139))
    $beforeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(239, 68, 68)) # Red
    $afterBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34, 197, 94))  # Green
    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    
    $g.DrawString("R003: Shell Visible Latency & Blank-Screen Window Reduction", $titleFont, $textBrush, 30, 20)
    $g.DrawString("Monolithic Root Suspense (Baseline) vs. Granular Partial Prerendering (Values in milliseconds)", $subFont, $mutedBrush, 32, 48)
    
    # Legend
    $g.FillRectangle($beforeBrush, 750, 25, 20, 14)
    $g.DrawString("Baseline (Monolithic Root Suspense)", $subFont, $textBrush, 775, 25)
    $g.FillRectangle($afterBrush, 750, 45, 20, 14)
    $g.DrawString("R003 (Granular PPR Boundaries)", $subFont, $textBrush, 775, 45)
    
    # Axis & grid lines (0 to 800 ms)
    $originY = 460
    $chartHeight = 360
    for ($val = 0; $val -le 800; $val += 100) {
        $y = $originY - ($val * ($chartHeight / 800))
        $g.DrawLine($gridPen, 100, $y, 1050, $y)
        $g.DrawString("${val}ms", $subFont, $mutedBrush, 50, $y - 6)
    }
    
    $categories = @(
        @{ Label = "Homepage Header/Hero"; Before = 536; After = 288; Diff = "-248ms (-46%)" },
        @{ Label = "PLP Header Shell"; Before = 511; After = 260; Diff = "-251ms (-49%)" },
        @{ Label = "Category Blank-After-TTFB"; Before = 463; After = 54; Diff = "-409ms (-88%)" },
        @{ Label = "PDP Blank-After-TTFB"; Before = 320; After = 38; Diff = "-282ms (-88%)" },
        @{ Label = "Category Shell Visible"; Before = 690; After = 283; Diff = "-407ms (-59%)" },
        @{ Label = "PDP Shell Visible"; Before = 571; After = 271; Diff = "-300ms (-53%)" }
    )
    
    $barW = 45
    $startX = 130
    $groupGap = 150
    
    for ($i = 0; $i -lt $categories.Length; $i++) {
        $cat = $categories[$i]
        $x = $startX + ($i * $groupGap)
        
        $hBefore = $cat.Before * ($chartHeight / 800)
        $yBefore = $originY - $hBefore
        $g.FillRectangle($beforeBrush, $x, $yBefore, $barW, $hBefore)
        $g.DrawString("$($cat.Before)ms", $barFont, $textBrush, $x + 2, $yBefore - 18)
        
        $hAfter = $cat.After * ($chartHeight / 800)
        $yAfter = $originY - $hAfter
        $g.FillRectangle($afterBrush, $x + $barW + 8, $yAfter, $barW, $hAfter)
        $g.DrawString("$($cat.After)ms", $barFont, $textBrush, $x + $barW + 10, $yAfter - 18)
        
        # Improvement text
        $g.DrawString($cat.Diff, $barFont, $afterBrush, $x + 2, $yAfter - 35)
        
        # X-Axis label
        $lblParts = $cat.Label.Split(' ')
        $lblY = $originY + 10
        foreach ($part in $lblParts) {
            $g.DrawString($part, $subFont, $textBrush, $x - 5, $lblY)
            $lblY += 14
        }
    }
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created $outputPath"
}

function Create-Payload-BarChart {
    param([string]$outputPath)
    $width = 1100
    $height = 550
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)
    
    $titleFont = New-Object System.Drawing.Font("Arial", 15, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Regular)
    $barFont = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
    
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 116, 139))
    $redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(239, 68, 68))
    $greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34, 197, 94))
    $blueBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(59, 130, 246))
    $purpleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(147, 51, 234))
    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240), 1)
    
    $g.DrawString("Payload Optimization & Regressions: Empirical Evidence (R006 & R011)", $titleFont, $textBrush, 30, 20)
    $g.DrawString("Comparing Transferred Kilobytes (KB) across experimental variants", $subFont, $mutedBrush, 32, 48)
    
    $subHeaderFont = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
    $divPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(203, 213, 225), 1)

    # Left Side: R006 Image Optimization
    $g.DrawString("R006: Direct Delivery vs. Edge Transform", $subHeaderFont, $textBrush, 80, 85)
    
    # Y Grid for left (0 to 180 KB)
    $originY = 460
    $chartHeight = 320
    for ($val = 0; $val -le 160; $val += 40) {
        $y = $originY - ($val * ($chartHeight / 160))
        $g.DrawLine($gridPen, 60, $y, 480, $y)
        $g.DrawString("${val}KB", $subFont, $mutedBrush, 20, $y - 6)
    }
    
    # Bars for R006
    # Bar 1: Next Image (77.7 KB)
    $h1 = 77.7 * ($chartHeight / 160)
    $g.FillRectangle($greenBrush, 120, $originY - $h1, 80, $h1)
    $g.DrawString("77.7 KB", $barFont, $textBrush, 135, $originY - $h1 - 18)
    $g.DrawString("Next.js Image`n(Runtime Transform)", $subFont, $textBrush, 110, $originY + 12)
    
    # Bar 2: Direct Prepared (149.3 KB)
    $h2 = 149.3 * ($chartHeight / 160)
    $g.FillRectangle($redBrush, 270, $originY - $h2, 80, $h2)
    $g.DrawString("149.3 KB", $barFont, $textBrush, 280, $originY - $h2 - 18)
    $g.DrawString("+92.0% Regression!", $barFont, $redBrush, 260, $originY - $h2 - 35)
    $g.DrawString("Direct Static`nPre-Generated Delivery", $subFont, $textBrush, 260, $originY + 12)
    
    # Vertical divider
    $g.DrawLine($divPen, 520, 80, 520, 480)
    
    # Right Side: R011 Cart Mutation Transfer (Bytes in KB: 570KB -> 458KB, 287KB -> 197KB, 693KB -> 469KB)
    $g.DrawString("R011: Cart Mutation Byte Reduction (Removal of router.refresh)", $subHeaderFont, $textBrush, 560, 85)
    
    # Y Grid for right (0 to 800 KB)
    for ($val = 0; $val -le 800; $val += 200) {
        $y = $originY - ($val * ($chartHeight / 800))
        $g.DrawLine($gridPen, 550, $y, 1050, $y)
        $g.DrawString("${val}KB", $subFont, $mutedBrush, 510, $y - 6)
    }
    
    $cartOps = @(
        @{ Label = "Add to Cart"; Before = 569.7; After = 458.5; Diff = "-19.5%" },
        @{ Label = "Update Qty"; Before = 287.0; After = 197.0; Diff = "-31.4%" },
        @{ Label = "Remove Item"; Before = 693.4; After = 468.9; Diff = "-32.4%" }
    )
    
    $startX2 = 580
    $groupGap2 = 160
    $barW2 = 45
    for ($j = 0; $j -lt $cartOps.Length; $j++) {
        $op = $cartOps[$j]
        $x2 = $startX2 + ($j * $groupGap2)
        
        $hB = $op.Before * ($chartHeight / 800)
        $g.FillRectangle($blueBrush, $x2, $originY - $hB, $barW2, $hB)
        $g.DrawString("$([int]$op.Before)KB", $subFont, $textBrush, $x2 - 2, $originY - $hB - 18)
        
        $hA = $op.After * ($chartHeight / 800)
        $g.FillRectangle($purpleBrush, $x2 + $barW2 + 6, $originY - $hA, $barW2, $hA)
        $g.DrawString("$([int]$op.After)KB", $subFont, $textBrush, $x2 + $barW2 + 4, $originY - $hA - 18)
        
        $g.DrawString($op.Diff, $barFont, $greenBrush, $x2 + 10, $originY - [Math]::Max($hB, $hA) - 35)
        $g.DrawString($op.Label, $subFont, $textBrush, $x2, $originY + 12)
    }
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created $outputPath"
}

# Run generation
Create-Architecture-Diagram "paper_latex\figures\architecture_topology.png"
Create-Waterfall-Diagram "paper_latex\figures\waterfall_comparison.png"
Create-Metrics-BarChart "paper_latex\figures\r003_streaming_latency.png"
Create-Payload-BarChart "paper_latex\figures\byte_transfer_matrix.png"

# Copy an editorial image for showcase
$sourceCraftImg = "media\ChatGPT Image Sep 17, 2026, 02_00_03 AM.png"
if (Test-Path $sourceCraftImg) {
    Copy-Item $sourceCraftImg "paper_latex\figures\editorial_craft.png" -Force
    Write-Output "Copied editorial craft image"
}
