import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { MapPin, Calendar, Clock, Users, Package, Truck, PlaneTakeoff, User, Phone, Milestone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BookingType, Priority } from "@shared/schema";
import { Location } from "@/components/booking-form";

interface BookingConfirmationPreviewProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingData: {
    bookingType: string;
    purpose: string;
    priority: string;
    pickupLocation: Location | null;
    dropoffLocation: Location | null;
    pickupTime: string;
    dropoffTime: string;
    employeeName: string;
    employeeId: string | number;
    cargoType?: string;
    numBoxes?: number;
    weight?: number;
    boxSize?: string[];
    tripType?: string;
    numPassengers?: number;
    passengerDetails?: Array<{ name: string; contact: string }>;
    withDriver?: boolean;
    remarks?: string;
    referenceNo?: string;
  };
  isSubmitting: boolean;
}

// Function to render priority badge with appropriate styling
const PriorityBadge = ({ priority }: { priority: string }) => {
  switch (priority) {
    case Priority.CRITICAL:
      return <Badge variant="destructive">Critical</Badge>;
    case Priority.EMERGENCY:
      return <Badge className="bg-amber-500">Emergency</Badge>;
    case Priority.HIGH:
      return <Badge className="bg-orange-500">High</Badge>;
    case Priority.NORMAL:
      return <Badge variant="outline">Normal</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

export function BookingConfirmationPreview({
  open,
  onClose,
  onConfirm,
  bookingData,
  isSubmitting
}: BookingConfirmationPreviewProps) {
  console.log("[DEBUG] BookingConfirmationPreview rendered with:", {
    open,
    isSubmitting,
    hasOnConfirmFn: typeof onConfirm === 'function',
    bookingDataKeys: bookingData ? Object.keys(bookingData) : 'no data'
  });
  // Calculate estimated distance if both pickup and dropoff locations are present
  const estimatedDistance = React.useMemo(() => {
    if (bookingData.pickupLocation?.coordinates && bookingData.dropoffLocation?.coordinates) {
      // Haversine formula for distance calculation
      const p1 = bookingData.pickupLocation.coordinates;
      const p2 = bookingData.dropoffLocation.coordinates;
      
      const R = 6371; // Earth's radius in km
      const dLat = (p2.lat - p1.lat) * Math.PI / 180;
      const dLon = (p2.lng - p1.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance.toFixed(1);
    }
    
    return null;
  }, [bookingData.pickupLocation, bookingData.dropoffLocation]);
  
  // Format timestamps for readable display
  const formattedPickupTime = bookingData.pickupTime ? 
    format(new Date(bookingData.pickupTime), 'PPP p') : 'Not specified';
  
  const formattedDropoffTime = bookingData.dropoffTime ? 
    format(new Date(bookingData.dropoffTime), 'PPP p') : 'Not specified';
  
  const pickupLocationDisplay = bookingData.pickupLocation?.address || 'Not specified';
  const dropoffLocationDisplay = bookingData.dropoffLocation?.address || 'Not specified';
  
  // Generate nice location display with district, city, area if available
  const getLocationWithRegionInfo = (location: Location | null) => {
    if (!location) return 'Not specified';
    
    let displayText = location.address;
    
    // Add region information if available (from UAE-specific fields)
    if (location.district || location.city || location.area) {
      let regionInfo = [];
      if (location.area) regionInfo.push(location.area);
      if (location.city) regionInfo.push(location.city);
      if (location.district && location.district !== location.city) {
        regionInfo.push(location.district);
      }
      
      if (regionInfo.length > 0) {
        displayText = `${location.address || location.name}\n${regionInfo.join(', ')}`;
      }
    }
    
    return displayText;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="text-xl">Booking Confirmation</span>
            <PriorityBadge priority={bookingData.priority} />
          </DialogTitle>
          <DialogDescription>
            Please review your booking details before confirming
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          {/* Booking overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  {bookingData.bookingType === BookingType.PASSENGER ? (
                    <Users className="h-5 w-5 text-primary" />
                  ) : (
                    <Package className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Booking Type</p>
                    <p className="text-sm">
                      {bookingData.bookingType === BookingType.PASSENGER ? 'Passenger' : 'Freight'} Transport
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Milestone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Purpose</p>
                    <p className="text-sm">{bookingData.purpose}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Employee</p>
                    <p className="text-sm">{bookingData.employeeName} (ID: {bookingData.employeeId})</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p className="text-sm">{bookingData.priority}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Location and time details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pickup Location</p>
                    <p className="text-sm whitespace-pre-line">{getLocationWithRegionInfo(bookingData.pickupLocation)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dropoff Location</p>
                    <p className="text-sm whitespace-pre-line">{getLocationWithRegionInfo(bookingData.dropoffLocation)}</p>
                  </div>
                </div>
                
                {estimatedDistance && (
                  <div className="flex items-start space-x-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Estimated Distance</p>
                      <p className="text-sm">{estimatedDistance} km</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Pickup Time</p>
                    <p className="text-sm">{formattedPickupTime}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Dropoff Time</p>
                    <p className="text-sm">{formattedDropoffTime}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Booking type specific details */}
          {bookingData.bookingType === BookingType.PASSENGER && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium mb-3">Passenger Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Number of Passengers</p>
                      <p className="text-sm">{bookingData.numPassengers}</p>
                    </div>
                  </div>
                  
                  {bookingData.withDriver !== undefined && (
                    <div className="flex items-start space-x-2">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Driver Required</p>
                        <p className="text-sm">{bookingData.withDriver ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  )}
                  
                  {bookingData.tripType && (
                    <div className="flex items-start space-x-2">
                      <PlaneTakeoff className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Trip Type</p>
                        <p className="text-sm">{bookingData.tripType}</p>
                      </div>
                    </div>
                  )}
                  
                  {bookingData.passengerDetails && Array.isArray(bookingData.passengerDetails) && bookingData.passengerDetails.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Passenger List</p>
                      <div className="border rounded-md p-3 space-y-3">
                        {bookingData.passengerDetails.map((passenger, index) => (
                          <div key={index} className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">{passenger.name}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">{passenger.contact}</p>
                              </div>
                            </div>
                            {bookingData.passengerDetails && Array.isArray(bookingData.passengerDetails) && index < bookingData.passengerDetails.length - 1 && <Separator className="my-2" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {bookingData.bookingType === BookingType.FREIGHT && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium mb-3">Freight Details</h3>
                <div className="space-y-3">
                  {bookingData.cargoType && (
                    <div className="flex items-start space-x-2">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Cargo Type</p>
                        <p className="text-sm">{bookingData.cargoType}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-2">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Number of Boxes</p>
                      <p className="text-sm">{bookingData.numBoxes}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Weight (kg)</p>
                      <p className="text-sm">{bookingData.weight}</p>
                    </div>
                  </div>
                  
                  {bookingData.boxSize && Array.isArray(bookingData.boxSize) && bookingData.boxSize.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Box Sizes</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {bookingData.boxSize.map((size, index) => (
                            <Badge key={index} variant="outline">{size}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Additional notes */}
          {(bookingData.remarks || bookingData.referenceNo) && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium mb-3">Additional Information</h3>
                
                {bookingData.referenceNo && (
                  <div className="flex items-start space-x-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Reference Number</p>
                      <p className="text-sm">{bookingData.referenceNo}</p>
                    </div>
                  </div>
                )}
                
                {bookingData.remarks && (
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Remarks</p>
                      <p className="text-sm">{bookingData.remarks}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter className="flex space-x-2 justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Edit Booking
          </Button>
          <Button 
            onClick={() => {
              console.log("%c CONFIRM BUTTON CLICKED", "background: #ff9800; color: white; padding: 4px; border-radius: 4px;");
              try {
                console.log("Calling onConfirm handler directly from button - bypassing event propagation");
                onConfirm();
              } catch (error) {
                console.error("Error in confirmation button handler:", error);
                alert("Error processing booking confirmation. See console for details.");
              }
            }} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}