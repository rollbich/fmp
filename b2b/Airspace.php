<?php
class Airspace
{

    private $xml;

    /**
     * Airspace constructor.
     * @param \SimpleXMLElement $airspace
     */
    public function __construct(\SimpleXMLElement $airspace)
    {
        $this->aixmNS = "http://www.aixm.aero/schema/5.1.1";
        if($airspace->getName() === 'Airspace') {
            $this->xml = $airspace;
        } else {
            throw new \UnexpectedValueException('Airspace Element expected');
        }
    }

    /**
     * Return ICAO Designator of an Airspace element
     *
     * @return type
     */
    public function getDesignator() : string
    {
        $timeslices = $this->xml->children($this->aixmNS)->timeSlice;
        foreach ($timeslices as $timeslice) {
            $airspacetimeslice = $timeslice->children($this->aixmNS)->AirspaceTimeSlice;
            foreach ($airspacetimeslice->children($this->aixmNS) as $child) {
                if ($child->getName() === 'designator') {
                    return (string) $child;
                }
            }
        }
        return "";
    }

    /**
     *
     * @return string
     * @throws \UnexpectedValueException
     */
    public function getTimeBegin()
    {
        $timeslices = $this->xml->children($this->aixmNS)->timeSlice;
        if (count($timeslices) >= 2) {
            foreach ($timeslices as $timeslice) {
                $validtime = $timeslice
                    ->children($this->aixmNS)
                    ->AirspaceTimeSlice
                    ->children('http://www.opengis.net/gml/3.2')
                    ->validTime;
                foreach ($validtime->children('http://www.opengis.net/gml/3.2') as $child) {
                    if ($child->getName() === 'TimePeriod') {
                        return $child->children('http://www.opengis.net/gml/3.2')->beginPosition;
                    }
                }
            }
        } else {
            throw new \UnexpectedValueException("Not a valid Airspace.");
        }
    }

    /**
     *
     * @return \DateTime
     */
    public function getDateTimeBegin()
    {
        $timeBegin = $this->getTimeBegin();
        return new \DateTime($timeBegin . "+00:00");
    }

    /**
     * @throws \UnexpectedValueException
     * @return string
     */
    public function getTimeEnd()
    {
        $timeslices = $this->xml->children($this->aixmNS)->timeSlice;
        if (count($timeslices) === 2) {
            foreach ($timeslices as $timeslice) {
                $validtime = $timeslice
                    ->children($this->aixmNS)
                    ->AirspaceTimeSlice
                    ->children('http://www.opengis.net/gml/3.2')
                    ->validTime;
                foreach ($validtime->children('http://www.opengis.net/gml/3.2') as $child) {
                    if ($child->getName() === 'TimePeriod') {
                        return $child->children('http://www.opengis.net/gml/3.2')->endPosition;
                    }
                }
            }
        } else {
            throw new \UnexpectedValueException("Not a valid Airspace.");
        }
    }

    /**
     *
     * @return \DateTime
     */
    public function getDateTimeEnd()
    {
        $timeEnd = $this->getTimeEnd();
        return new \DateTime($timeEnd . '+00:00');
    }

    /**
     *
     * @return String
     */
    public function getUpperLimit() : string
    {
        $timeslices = $this->xml->children($this->aixmNS)->timeSlice;
        if (count($timeslices) === 2) {
            foreach ($timeslices as $timeslice) {
                $airspacetimeslice = $timeslice->children($this->aixmNS)->AirspaceTimeSlice;
                foreach ($airspacetimeslice->children($this->aixmNS) as $child) {
                    if ($child->getName() === 'activation') {
                        return (string) $child
                            ->children($this->aixmNS)
                            ->AirspaceActivation
                            ->children($this->aixmNS)
                            ->levels
                            ->children($this->aixmNS)
                            ->AirspaceLayer
                            ->children($this->aixmNS)
                            ->upperLimit;
                    }
                }
            }
        }
    }

    /**
     * @throws \UnexpectedValueException
     * @return String
     */
    public function getLowerLimit() : string
    {
        $timeslices = $this->xml->children($this->aixmNS)->timeSlice;
        if (count($timeslices) === 2) {
            foreach ($timeslices as $timeslice) {
                $airspacetimeslice = $timeslice->children($this->aixmNS)->AirspaceTimeSlice;
                foreach ($airspacetimeslice->children($this->aixmNS) as $child) {
                    if ($child->getName() === 'activation') {
                        return (string) $child
                            ->children($this->aixmNS)
                            ->AirspaceActivation
                            ->children($this->aixmNS)
                            ->levels
                            ->children($this->aixmNS)
                            ->AirspaceLayer
                            ->children($this->aixmNS)
                            ->lowerLimit;
                    }
                }
            }
        } else {
            throw new \UnexpectedValueException("Not a valid Airspace.");
        }
    }

}